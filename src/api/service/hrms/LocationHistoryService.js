'use strict';
const { LocationHistory } = require('@models').system;
const { respondCreated } = require('@utils/response');
const { getAllEntities } = require('@utils/request-handler');
const { findAndDelete } = require('@utils/request-handler');
const { findAndGet } = require('@utils/request-handler');
const { findAndUpdate } = require('@utils/request-handler');

/**
 *
 * delete location history by id
 *
 * id String id of a location history record
 * returns Object
 **/
exports.deleteLocationHistoriesId = async function (id) {
  return await findAndDelete(id, LocationHistory);
};

/**
 * Your GET endpoint
 * get all location
 *
 * returns Object
 **/
exports.getLocationHistories = async function (query) {
  return await getAllEntities(query, LocationHistory);
};

/**
 * Your GET endpoint
 * get location history recrod by id
 *
 * id String id of a location history record
 * returns Object
 **/
exports.getLocationHistoriesIed = async function (id) {
  return await findAndGet(id, LocationHistory);
};

/**
 *
 * add a location history to the system
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postLocationHistories = async function (body) {
  return respondCreated(await LocationHistory.create(body));
};

/**
 *
 * update a location history record by
 *
 * id String id of a location history record
 * body Body  (optional)
 * returns Object
 **/
exports.putLocationHistoriesId = async function (id, body) {
  return await findAndUpdate(id, body, LocationHistory);
};
