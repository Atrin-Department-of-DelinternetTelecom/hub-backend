'use strict';

const Aire_InvoiceService = require('../service/intranet/Aire_InvoiceService');

/**
 * @param {{ periodId: number, tandas: number }} params
 */
module.exports = async function _consolideTanda(params, bulk) {
  console.log('aire consolide lines job started', params);
  await Aire_InvoiceService._consolideTanda(params);
};
