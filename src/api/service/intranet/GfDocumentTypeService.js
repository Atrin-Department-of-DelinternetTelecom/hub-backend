'use strict';

const { GfDocumentType } = require('@models').intranet;

const {
  getAllEntities,
  createCatch,
  findAndGet,
  findAndUpdate,
  findAndDelete,
  findAndDeleteIntranet,
} = require('@utils/request-handler');

/**
 *
 * delete a category record by id
 *
 * id String
 * returns Object
 **/
exports.deleteGfDocumentTypesId = async function (id) {
  return await findAndDelete(id, GfDocumentType);
};

/**
 *
 * soft delete proccess
 *
 * id String
 * returns Object
 **/
exports.destroyGfDocumentTypesId = async function (id) {
  return await findAndDeleteIntranet(id, GfDocumentType);
};

/**
 * Your GET endpoint
 * get all categories(information) record
 *
 * returns Object
 **/
exports.getGfDocumentTypes = async function (query) {
  return await getAllEntities(query, GfDocumentType);
};

/**
 * Your GET endpoint
 * get single category record by id
 *
 * id String
 * returns Object
 **/
exports.getGfDocumentTypesId = async function (id) {
  return await findAndGet(id, GfDocumentType);
};

/**
 *
 * add a category record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postGfDocumentTypes = async function (body, creator_id) {
  body.creator_id = creator_id;
  return createCatch(body, GfDocumentType);
};

/**
 *
 * update a category record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected category (optional)
 * returns Object
 **/
exports.putGfDocumentTypesId = async function (id, body) {
  return await findAndUpdate(id, body, GfDocumentType);
};
