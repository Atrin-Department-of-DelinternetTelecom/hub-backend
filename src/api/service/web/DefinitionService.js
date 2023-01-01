'use strict';

const { Definition, Pack, LastUpdate } = require('@models').system;

const {
  getAllEntities,
  createCatch,
  findAndUpdate,
  findAndDelete,
  findAndGet,
} = require('@utils/request-handler');

const { respondBadRequest } = require('@utils/response');

const { updateDates } = require('@service/web/LastUpdateService');

/**
 *
 * delete a definition record by id
 *
 * id String
 * returns Object
 **/
exports.deleteDefinitionsId = async function (id) {
  return await findAndDelete(id, Definition);
};

/**
 * Your GET endpoint
 * get all definitions(information) record
 *
 * returns Object
 **/
exports.getDefinitions = async function (query) {
  return await getAllEntities(query, Definition);
};

/**
 * Your GET endpoint
 * get single definition record by id
 *
 * id String
 * returns Object
 **/
exports.getDefinitionsId = async function (id) {
  return await findAndGet(id, Definition);
};

/**
 *
 * add a definition record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postDefinitions = async function (body, creator_id) {
  if (
    body.pack_id == undefined ||
    (await Pack.findByPk(body.pack_id)) === null
  ) {
    return respondBadRequest('pack not found');
  }
  body.creator_id = creator_id;
  return createCatch(body, Definition);
};

/**
 *
 * update a definitions record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected Definition (optional)
 * returns Object
 **/
exports.putDefinitionsId = async function (id, body) {
  return await findAndUpdate(id, body, Definition);
};

Definition.afterBulkUpdate((options) => {
  updateDates(LastUpdate);
});

Definition.afterCreate((instance, options) => {
  updateDates(LastUpdate);
});
