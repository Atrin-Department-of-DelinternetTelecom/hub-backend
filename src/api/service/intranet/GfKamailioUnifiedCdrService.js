'use strict';

const { GfKamailioUnifiedCdr } = require('@models').intranet;

const { getAllEntities, findAndGet } = require('@utils/request-handler');

/**
 * Your GET endpoint
 * get all crm task extra fields record
 *
 * returns Object
 **/
exports.getGfKamailioUnifiedCdrs = async function (query) {
  return await getAllEntities(query, GfKamailioUnifiedCdr);
};

/**
 * Your GET endpoint
 * get single Gf Kamailio unified Cdr record by id
 *
 * id String
 * returns Object
 **/
exports.getGfKamailioUnifiedCdrsId = async function (id) {
  return await findAndGet(id, GfKamailioUnifiedCdr);
};
