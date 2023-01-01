'use strict';

const { MoozaicMailSender } = require('@models').moozaic;

const { getAllEntities } = require('@utils/request-handler');

/**
 * Your GET endpoint
 * get all  Gf Kamailio Provider Cdrs record
 *
 * returns Object
 **/
exports.getMailSenders = async function (query) {
  return await getAllEntities(query, MoozaicMailSender);
};
