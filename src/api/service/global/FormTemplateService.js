'use strict';

const { FormTemplate, FormCategory, User } = require('@models').system;

const {
  findAndGet,
  findAndUpdate,
  findAndDelete,
  getAllEntities,
} = require('@utils/request-handler');

const {
  respondBadRequest,
  respondNotFound,
  respondCreated,
} = require('@utils/response');

const config = require('@config');

const _ = require('lodash');

const FormFieldType = config.get('index.FormFieldType');

/**
 *
 * delete a FormTemplate record by id
 *
 * id String
 * returns Object
 **/
exports.deleteFormTemplatesId = async function (id) {
  return await findAndDelete(id, FormTemplate);
};

/**
 * Your GET endpoint
 * get all FormTemplate(information) record
 *
 * returns Object
 **/
exports.getFormTemplates = async function (query) {
  return await getAllEntities(query, FormTemplate);
};

/**
 * Your GET endpoint
 * get single FormTemplate record by id
 *
 * id String
 * returns Object
 **/
exports.getFormTemplatesId = async function (id) {
  return await findAndGet(id, FormTemplate);
};

/**
 *
 * add a FormTemplate record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postFormTemplates = async function (body, creator_id) {
  if (isValidFormTemplate(body.form_object.controls)) {
    const { form_category_id } = body;

    let form_category = null;
    if (!_.isNull(form_category_id) && !_.isUndefined(form_category_id)) {
      form_category = await FormCategory.findByPk(form_category_id);
    } else {
      form_category = await FormCategory.create({
        name: body.name,
        current_version_form_template_id: 0,
        creator_id,
      });
    }
    if (_.isNull(form_category)) {
      return respondNotFound(
        `form category with id ${form_category_id} not found.`,
      );
    }

    body.creator_id = creator_id;
    body.form_category_id = form_category.id;

    const newFormTemplate = await FormTemplate.create({
      name: form_category.name,
      form_category_id: form_category.id,
      form_object: body.form_object,
      creator_id,
    });

    form_category.current_version_form_template_id = newFormTemplate.id;
    await form_category.save();

    return respondCreated(newFormTemplate);
  }
  return respondBadRequest('form object is not valid');
};

const isValidFormTemplate = (form_template) => {
  return (
    !_.isUndefined(form_template) &&
    isUniqueProps(form_template) &&
    hasNameProps(form_template) &&
    hasValidTypeProp(form_template)
  );
};

const isUniqueProps = (form_template) => {
  const unique = [...new Set(form_template.map((item) => item.name))];
  return unique.length === form_template.length ? true : false;
};

const hasNameProps = (form_object) => {
  for (const field of form_object) {
    if (_.isNull(field.name) || _.isUndefined(field.name)) {
      return false;
    }
  }
  return true;
};

const hasValidTypeProp = (form_object) => {
  for (const field of form_object) {
    if (
      _.isNull(field.type) ||
      _.isUndefined(field.type) ||
      !FormFieldType.includes(field.type)
    ) {
      return false;
    }
  }
  return true;
};

/**
 *
 * update a FormTemplate record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected formTemplate (optional)
 * returns Object
 **/
exports.putFormTemplatesId = async function (id, body) {
  return await findAndUpdate(id, body, FormTemplate);
};
