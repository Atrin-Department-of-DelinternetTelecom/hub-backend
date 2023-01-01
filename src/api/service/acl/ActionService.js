'use strict';

const { AclAction } = require('@models').system;
const { getAllEntities, createCatch } = require('@utils/request-handler');
const { findAndDelete } = require('@utils/request-handler');
const { findAndGet } = require('@utils/request-handler');
const { findAndUpdate } = require('@utils/request-handler');
const { respondBadRequest } = require('@utils/response');

/**
 *
 * delete a action record by id
 *
 * id String
 * returns Object
 **/
exports.deleteActionsId = async function (id) {
  return await findAndDelete(id, AclAction);
};

/**
 * Your GET endpoint
 * get all action(information) record
 *
 * returns Object
 **/
exports.getActions = async function (query) {
  return await getAllEntities(query, AclAction);
};

/**
 * Your GET endpoint
 * get single action record by id
 *
 * id String
 * returns Object
 **/
exports.getActionsId = async function (id) {
  return await findAndGet(id, AclAction);
};

/**
 *
 * add a action record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postActions = async function (body, creator_id) {
  body.creator_id = creator_id;
  return createCatch(body, AclAction);
};

/**
 *
 * update a action record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected action (optional)
 * returns Object
 **/
exports.putActionsId = async function (id, body) {
  return await findAndUpdate(id, body, AclAction);
};
