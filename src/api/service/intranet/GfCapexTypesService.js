'use strict';

const { GfCapexType } = require('@models').intranet;
const { getAllEntities } = require('@utils/request-handler');

/**
 * Your GET endpoint
 * get all categories(information) record
 *
 * returns Object
 **/
exports.getGfCapexTypes = async function (query) {
  return await getAllEntities(query, GfCapexType);
};
