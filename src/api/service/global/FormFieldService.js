'use strict';

const { FormField, User } = require('@models').system;

const {
  findAndGet,
  findAndUpdate,
  findAndDelete,
  getAllEntities,
  createCatch,
} = require('@utils/request-handler');

const { respondBadRequest } = require('@utils/response');

/**
 *
 * delete a Form Field record by id
 *
 * id String
 * returns Object
 **/
exports.deleteFormFieldsId = async function (id) {
  return await findAndDelete(id, FormField);
};

/**
 * Your GET endpoint
 * get all FormField(information) record
 *
 * returns Object
 **/
exports.getFormFields = async function (query) {
  return await getAllEntities(query, FormField);
};

/**
 * Your GET endpoint
 * get single Form Field record by id
 *
 * id String
 * returns Object
 **/
exports.getFormFieldsId = async function (id) {
  return await findAndGet(id, FormField);
};

/**
 *
 * add a Form record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postFormFields = async function (body, creator_id) {
  body.creator_id = creator_id;
  return createCatch(body, FormField);
};

/**
 *
 * update a Form Field record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected form (optional)
 * returns Object
 **/
exports.putFormFieldsId = async function (id, body) {
  return await findAndUpdate(id, body, FormField);
};
