'use strict';

const { Form, User, FormTemplate, FormField, File, FormCategory } =
  require('@models').system;

const {
  findAndGet,
  findAndUpdate,
  findAndDelete,
  getAllEntities,
  createCatch,
} = require('@utils/request-handler');

const { modelToJson } = require('@utils/tools');

const {
  respondBadRequest,
  respondNotFound,
  respondCreated,
  respondSuccess,
} = require('@utils/response');

const _ = require('lodash');

const { saveSingleFile } = require('@utils/file-utils');

const config = require('@config');

/**
 *
 * delete a Form record by id
 *
 * id String
 * returns Object
 **/
exports.deleteFormsId = async function (id) {
  return await findAndDelete(id, Form);
};

/**
 * Your GET endpoint
 * get all Form(information) record
 *
 * returns Object
 **/
exports.getForms = async function (query) {
  return await getAllEntities(query, Form);
};

/**
 * Your GET endpoint
 * get single Form record by id
 *
 * id String
 * returns Object
 **/
exports.getFormsId = async function (id) {
  const form = await Form.findByPk(id, {
    include: {
      all: true,
    },
  });
  if (_.isNull(form)) {
    return respondNotFound(`form with id ${id} not found`);
  }
  return respondSuccess(generateFormForShow(form));
};

/**
 *
 * add a Form record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postForms = async function (body, creator_id) {
  const owner = await User.findByPk(body.owner_id);
  if (_.isNull(owner)) {
    return respondNotFound(`owner with id ${body.owner_id} not found`);
  }

  const form_category = await FormCategory.findByPk(body.form_category_id, {
    include: {
      model: FormTemplate,
      as: 'current_version',
    },
  });
  if (_.isNull(form_category)) {
    return respondNotFound(
      `form category with id ${body.form_category_id} not found`,
    );
  }
  body.form_template_id = form_category.current_version_form_template_id;

  // check validation of key-value based on form_template object
  const results = validateFormFeilds(
    form_category.current_version.form_object.controls,
    body,
  );
  if (results.status === 'fail') {
    return respondBadRequest(results);
  }

  body.creator_id = creator_id;
  const new_form = await Form.create(body);

  const fields = await generateFormFields(
    form_category.current_version.form_object.controls,
    body,
  );
  // bulk insert form field
  FormField.bulkCreate(
    fields.map((item) => ({
      ...item,
      form_id: new_form.id,
      creator_id,
    })),
  );

  // generate form-field based on key-value and template
  return respondSuccess(
    generateFormForShow(
      await Form.findByPk(new_form.id, {
        include: {
          all: true,
        },
      }),
    ),
  );
};

const validateFormFeilds = (form_object, form_data) => {
  const errors = [];
  for (const field of form_object) {
    if (
      (field.required &&
        (_.isNull(form_data[field.name]) ||
          _.isUndefined(form_data[field.name]))) ||
      !isValidValueBasedOnType(field.type, form_data[field.name])
    ) {
      errors.push({
        field: field.name,
        reason: 'invalid data',
      });
    }
  }

  if (errors.length !== 0) {
    return {
      status: 'fail',
      errors,
    };
  }

  return {
    status: 'success',
  };
};

const generateFormFields = async (form_object, form_data) => {
  const form_fields = [];
  for (const field of form_object) {
    form_fields.push(
      await generateFormFieldBasedOnValueAndField(field, form_data[field.name]),
    );
  }
  return form_fields;
};

const isValidValueBasedOnType = (type, data) => {
  switch (type) {
    case 'number':
      return !isNaN(data);
    case 'text':
    case 'textarea':
    case 'datepicker':
    case 'timepicker':
    case 'datetimepicker':
    case 'colorpicker':
    case 'iconSelector':
    case 'password':
    case 'select':
    case 'asyncselect':
      return _.isString(data);
    case 'multiselect':
    case 'asyncmultiselect':
      return Array.isArray(JSON.parse(data));
    case 'email':
      return isEmail(data);
    case 'searcher':
      return _.isObject(JSON.parse(data));
    case 'currency':
      return !isNaN(data) && data.toString().indexOf('.') != -1 ? true : false;
    case 'inputfile':
      return isFile(data);
    case 'switch':
    case 'checkbox':
      return _.isBoolean(data) || data === 'true' || data === 'false'
        ? true
        : false;
    default:
      return false;
  }
};

const isFile = (data) => {
  return !_.isUndefined(data.name) && !_.isUndefined(data.data);
};

const generateFormFieldBasedOnValueAndField = async (field, data) => {
  switch (field.type) {
    case 'number':
      return {
        type: field.type,
        name: field.name,
        value: data,
        dataType: 'integer',
      };
    case 'text':
    case 'textarea':
    case 'datepicker':
    case 'timepicker':
    case 'datetimepicker':
    case 'colorpicker':
    case 'iconSelector':
    case 'password':
    case 'select':
    case 'asyncselect':
      return {
        type: field.type,
        name: field.name,
        value: data,
        dataType: 'string',
        metadata:
          !_.isUndefined(field.option) && !_.isNull(field.option)
            ? field.option
            : undefined,
      };
    case 'multiselect':
    case 'asyncmultiselect':
      return {
        type: field.type,
        name: field.name,
        value: JSON.stringify(data),
        dataType: 'array',
        metadata:
          !_.isUndefined(field.option) && !_.isNull(field.option)
            ? field.option
            : undefined,
      };
    case 'email':
      return {
        type: field.type,
        name: field.name,
        value: data,
        dataType: 'string',
        metadata:
          !_.isUndefined(field.option) && !_.isNull(field.option)
            ? field.option
            : undefined,
      };
    case 'searcher':
      return {
        type: field.type,
        name: field.name,
        value: JSON.stringify(data),
        dataType: 'object',
        metadata:
          !_.isUndefined(field.option) && !_.isNull(field.option)
            ? field.option
            : undefined,
      };
    case 'currency':
      return {
        type: field.type,
        name: field.name,
        value: data,
        dataType: 'float',
        metadata:
          !_.isUndefined(field.option) && !_.isNull(field.option)
            ? field.option
            : undefined,
      };
    case 'inputfile':
      return await createFileMetadata(field, data);
    case 'switch':
    case 'checkbox':
      return {
        type: field.type,
        name: field.name,
        value: data,
        dataType: 'boolean',
        metadata:
          !_.isUndefined(field.option) && !_.isNull(field.option)
            ? field.option
            : undefined,
      };
    default:
      return false;
  }
};

const createFileMetadata = async (field, file) => {
  const pathOfFile = await saveSingleFile(
    file,
    config.get('index.FilesAndDirectories.FormFile'),
  );

  const fileModel = await File.create({
    file: pathOfFile,
    fileable_id: 0,
    fileable_type: 'form files',
  });

  return {
    type: field.type,
    name: field.name,
    value: fileModel.id,
    dataType: 'file',
    metadata:
      !_.isUndefined(field.option) && !_.isNull(field.option)
        ? {
            ...field.option,
            file_id: fileModel.id,
            file_name: file.name,
          }
        : {
            file_id: fileModel.id,
            file_name: file.name,
          },
  };
};

const isEmail = (email) => {
  //     const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  //     return re.test(String(email).toLowerCase());
  return true;
};

/**
 *
 * update a Form record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected form (optional)
 * returns Object
 **/
exports.putFormsId = async function (id, body) {
  const form = await Form.findByPk(id, {
    include: {
      model: FormTemplate,
      as: 'form_template',
    },
  });

  // check validation of key-value based on form_template object
  const results = validateFormFeilds(
    form.form_template.form_object.controls,
    body,
  );
  if (results.status === 'fail') {
    return respondBadRequest(results);
  }

  await updateFormFields(id, body);

  return generateFormForShow(
    await Form.findByPk(id, {
      include: {
        all: true,
      },
    }),
  );
};

const updateFormFields = async (form_id, fields) => {
  delete fields.form_category_id;
  delete fields.name;
  delete fields.owner_id;
  for (const fieldKey in fields) {
    const fieldValue = fields[fieldKey];
    const fieldModel = await FormField.findOne({
      where: {
        form_id,
        name: fieldKey,
      },
    });
    if (fieldModel.value !== fieldValue) {
      fieldModel.value = fieldValue;
      await fieldModel.save();
    }
  }
};

const generateFormForShow = (form) => {
  const data = {};
  for (const field of form.form_fields) {
    if (field.type === 'inputfile') {
      data[field.name] = {
        id: field.value,
        filename: field.metadata.file_name,
      };
    } else {
      data[field.name] = field.value;
    }
  }
  return {
    ...modelToJson(form),
    form_object: {
      ...form.form_template.form_object,
      data,
    },
  };
};
