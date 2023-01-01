'use strict';

const { FormCategory, FormTemplate, User } = require('@models').system;

const {
  findAndGet,
  findAndUpdate,
  findAndDelete,
  getAllEntities,
  createCatch,
} = require('@utils/request-handler');

const { respondBadRequest, respondNotFound } = require('@utils/response');

const _ = require('lodash');

/**
 *
 * delete a Form Categoriesrecord by id
 *
 * id String
 * returns Object
 **/
exports.deleteFormCategoriesId = async function (id) {
  return await findAndDelete(id, FormCategory);
};

/**
 * Your GET endpoint
 * get all FormCategoriesinformation) record
 *
 * returns Object
 **/
exports.getFormCategories = async function (query) {
  return await getAllEntities(query, FormCategory);
};

/**
 * Your GET endpoint
 * get single Form Categoriesrecord by id
 *
 * id String
 * returns Object
 **/
exports.getFormCategoriesId = async function (id) {
  return await findAndGet(id, FormCategory);
};

/**
 *
 * add a Form record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postFormCategories = async function (body, creator_id) {
  console.log(body);
  const formTemplate = await FormTemplate.findByPk(
    body.current_version_form_template_id,
  );
  if (_.isNull(formTemplate)) {
    return respondNotFound(
      `form_template with id ${body.current_version_form_template_id}`,
    );
  }

  const formCategory = await FormCategory.findOne({
    where: {
      name: body.name,
    },
  });
  if (!_.isNull(formCategory)) {
    return respondBadRequest(
      `form_template with name ${formCategory.name} already exist`,
    );
  }

  body.creator_id = creator_id;
  return createCatch(body, FormCategory);
};

/**
 *
 * update a Form category record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected form (optional)
 * returns Object
 **/
exports.putFormCategoriesId = async function (id, body) {
  return await findAndUpdate(id, body, FormCategory);
};
