'use strict';

const utils = require('@utils/writer');
const InvoiceBankData = require('@service/intranet/InvoiceBankDataService');

module.exports.getInvoiceBanksData = function getInvoiceBanksData(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  InvoiceBankData.getInvoiceBanksData(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
