'use strict';

const { Template, File } = require('@models').system;
const allModels = require('@models').allModels;
const path = require('path');
const hbs = require('express-handlebars');
const { getAllEntities } = require('@utils/request-handler');
const { findAndDelete } = require('@utils/request-handler');
const { findAndGet } = require('@utils/request-handler');
const { findAndUpdate } = require('@utils/request-handler');
const {
  respondBadRequest,
  respondCreated,
  isResponsePayload,
  respondSuccess,
} = require('@utils/response');
const fileUtils = require('@utils/file-utils');
const config = require('@config');
const fs = require('fs');
const fse = require('fs-extra');
const { downloadFile } = require('@utils/file-utils');
const _ = require('lodash');

const handlebars = hbs.create({
  layoutsDir: path.resolve('@uploads/template'),
  defaultLayout: false,
});

const { modelToJson } = require('@utils/tools');

/**
 *
 * delete a notification record by id
 *
 * id String
 * returns Object
 **/
exports.deleteTemplatesId = async function (id) {
  return await findAndDelete(id, Template);
};

/**
 * Your GET endpoint
 * get all notification(information) record
 *
 * returns Object
 **/
exports.getTemplates = async function (query) {
  return await getAllEntities(query, Template);
};

/**
 * Your GET endpoint
 * get single notification record by id
 *
 * id String
 * returns Object
 **/
exports.getTemplatesId = async function (id) {
  return await findAndGet(id, Template);
};

/**
 *
 * add a notification record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postTemplates = async function (body, template_file, creator_id) {
  try {
    body.metadata = JSON.parse(body.metadata ? body.metadata : '{}');
  } catch (error) {
    return respondBadRequest('metadata is not valid json');
  }

  const template = await Template.create({ ...body, creator_id });
  fileUtils.saveSingleFileOrExtractAndSave(
    template_file,
    config.get('index.FilesAndDirectories.Template'),
    template,
    'template_file_id',
  );
  return respondCreated(template);
};

/**
 *
 * update a notification record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected notification (optional)
 * returns Object
 **/
exports.putTemplatesId = async function (id, body) {
  return findAndUpdate(id, body, Template);
};

/**
 *
 * get file template
 *
 * id
 *
 * returns all
 **/
exports.getTemplatesFileId = async function (id) {
  const template = await findAndGet(
    id,
    Template,
    {
      model: File,
      as: 'template_file',
    },
    false,
    true,
  );
  return isResponsePayload(template)
    ? template
    : downloadFile(template.template_file);
};

exports.getRenderTemplate = async function (body) {
  const render = await getRenderTemplateText(body);
  if (isResponsePayload(render)) {
    return render;
  }
  return respondSuccess({
    render,
  });
};

exports.getRenderTemplateFile = async function (body) {
  const render = await getRenderTemplateText(body);
  if (isResponsePayload(render)) {
    return render;
  }

  // return path
  return writeRenderFile(render);
};

exports.getRenderTemplateByEntity = async function (body) {
  const render = await getRenderTemplateTextByEntity(body);
  if (isResponsePayload(render)) {
    return render;
  }

  return respondSuccess({
    render,
  });
};

exports.getRenderTemplateFileByEntity = async function (body) {
  const render = await getRenderTemplateTextByEntity(body);
  if (isResponsePayload(render)) {
    return render;
  }

  // return path
  return writeRenderFile(render);
};

const getRenderTemplateTextByEntity = async function (body) {
  const { template_id, entity, entity_id, context } = body;

  //get and check template
  const template = await Template.findByPk(template_id, {
    include: {
      model: File,
      as: 'template_file',
    },
  });
  if (!template) {
    return respondBadRequest('template not found');
  }

  //get and check entity model and record
  if (allModels[entity] === null) {
    return respondBadRequest('entity not found');
  }
  const entityModel = await allModels[entity].findByPk(entity_id);
  if (entityModel === null) {
    return respondBadRequest(`entity ${entity_id} not found`);
  }

  // convert to json and return text
  const entityContext = modelToJson(entityModel);
  return handlebars.render(path.resolve(template.template_file.file), {
    ...entityContext,
    ...context,
  });
};

const getRenderTemplateText = async function (body) {
  const { template_id, context } = body;
  console.log(context);
  //get and check template
  const template = await Template.findByPk(template_id, {
    include: {
      model: File,
      as: 'template_file',
    },
  });
  if (!template) {
    return respondBadRequest('template not found');
  }

  return handlebars.render(path.resolve(template.template_file.file), context);
};

const writeRenderFile = async function (render) {
  const { uploads, InitedTemplate } = config.get('index.FilesAndDirectories');
  const directory = path.resolve(uploads, InitedTemplate);

  await fse.ensureDir(directory);

  const file_path = path.join(
    uploads,
    InitedTemplate,
    `${InitedTemplate}-${Date.now()}.html`,
  );

  await fs.promises.writeFile(path.resolve(file_path), render);

  return path.resolve(file_path);
};

exports.getRenderDemoById = async function (id) {
  //get and check template
  const template = await Template.findByPk(id);
  if (!template) {
    return respondBadRequest('template not found');
  }

  //check that the template has fake context
  if (
    _.isNull(template.metadata) ||
    _.isUndefined(template.metadata.fake_context)
  ) {
    return respondBadRequest("this template doesn't have fake context");
  }

  //write to file and download
  const render = await getRenderTemplateText({
    template_id: id,
    context: template.metadata.fake_context,
  });
  return writeRenderFile(render);
};

exports.getRenderTextById = async function (id) {
  //get and check template
  const template = await Template.findByPk(id, {
    include: {
      model: File,
      as: 'template_file',
    },
  });
  if (!template) {
    return respondBadRequest('template not found');
  }
  const templateText = await fs.promises.readFile(
    path.resolve(template.template_file.file),
    { encoding: 'utf-8' },
  );

  return respondSuccess({
    template: templateText,
    name: template.name,
    id: template.id,
  });
};
