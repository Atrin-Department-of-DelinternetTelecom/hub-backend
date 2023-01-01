'use strict';

const { createCatch } = require('@utils/request-handler');
const { findAndDelete } = require('@utils/request-handler');
const { findAndDeleteIntranet } = require('@utils/request-handler');
const { findAndGet } = require('@utils/request-handler');
const { findAndUpdate } = require('@utils/request-handler');
const { getAllEntities } = require('@utils/request-handler');
const { GfClientDocumentConcept } = require('@models').intranet;

/**
 *
 * delete a category record by id
 *
 * id String
 * returns Object
 **/
exports.deleteGfClientDocumentConceptsId = async function (id) {
  return await findAndDelete(id, GfClientDocumentConcept);
};

/**
 *
 * soft delete proccess
 *
 * id String
 * returns Object
 **/
exports.destroyGfClientDocumentConceptsId = async function (id) {
  return await findAndDeleteIntranet(id, GfClientDocumentConcept);
};

/**
 * Your GET endpoint
 * get all categories(information) record
 *
 * returns Object
 **/
exports.getGfClientDocumentConcepts = async function (query) {
  return await getAllEntities(query, GfClientDocumentConcept);
};

/**
 * Your GET endpoint
 * get single category record by id
 *
 * id String
 * returns Object
 **/
exports.getGfClientDocumentConceptsId = async function (id) {
  return await findAndGet(id, GfClientDocumentConcept);
};

/**
 *
 * add a category record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postGfClientDocumentConcepts = async function (body) {
  return await createCatch(body, GfClientDocumentConcept);
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
exports.putGfClientDocumentConceptsId = async function (resourceId, body) {
  return await findAndUpdate(
    resourceId,
    { ...body, resourceId },
    GfClientDocumentConcept,
  );
};
