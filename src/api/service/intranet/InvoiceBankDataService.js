'use strict';

const { InvoiceBanksData } = require('@models').intranet;
const { getAllEntities } = require('@utils/request-handler');

exports.getInvoiceBanksData = async function (query) {
  return await getAllEntities(query, InvoiceBanksData);
};
