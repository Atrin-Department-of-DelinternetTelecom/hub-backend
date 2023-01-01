'use strict';

const { FormTag, FormCategory, FormField, User } = require('@models').system;

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
 * delete a Form Tag record by id
 *
 * id String
 * returns Object
 **/
exports.deleteFormTagsId = async function (id) {
  return await findAndDelete(id, FormTag);
};

/**
 * Your GET endpoint
 * get all FormTag(information) record
 *
 * returns Object
 **/
exports.getFormTags = async function (query) {
  return await getAllEntities(query, FormTag);
};

/**
 * Your GET endpoint
 * get single Form Tag record by id
 *
 * id String
 * returns Object
 **/
exports.getFormTagsId = async function (id) {
  return await findAndGet(id, FormTag);
};

/**
 *
 * add a Form record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postFormTags = async function (body, creator_id) {
  const formCategory = await FormCategory.findByPk(body.form_category_id);
  if (_.isNull(formCategory)) {
    return respondNotFound(`form_category with id ${body.form_category_id}`);
  }

  const formTag = await FormTag.findOne({
    where: {
      name: body.name,
    },
  });
  if (!_.isNull(formTag)) {
    return respondBadRequest(
      `form_tag with name ${formTag.name} already exist`,
    );
  }

  body.creator_id = creator_id;
  return createCatch(body, FormTag);
};

/**
 *
 * update a Form Tag record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected form (optional)
 * returns Object
 **/
exports.putFormTagsId = async function (id, body) {
  return await findAndUpdate(id, body, FormField);
};
