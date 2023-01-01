'use strict';

const GfInvoicePeriodService = require('../service/intranet/GfInvoicePeriodService');

/**
 * @param {{ periodId: number, tandas: number }} params
 */
module.exports = async function _throwBackInvoiceCue(params, bulk) {
  await GfInvoicePeriodService._throwBackInvoiceCue(params);
};
