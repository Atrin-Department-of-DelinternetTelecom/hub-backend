'use strict';

const { GfKamailioProvider } = require('@models').intranet;

const { getAllEntities } = require('@utils/request-handler');

/**
 * Your GET endpoint
 * get all  Gf Kamailio Provider Cdrs record
 *
 * returns Object
 **/
exports.getGfKamailioProviders = async function (query) {
  return await getAllEntities(query, GfKamailioProvider);
};
