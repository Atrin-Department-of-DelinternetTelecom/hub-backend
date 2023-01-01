'use strict';

const utils = require('@utils/writer');
const FixCdr = require('@service/intranet/FixCDR_GfTmpKamailioInvoiceService');

module.exports.getFixCdrByContractId = function getFixCdrByContractId(
  req,
  res,
  next,
) {
  const contractId = req.swagger.params.contractId.value;
  const periodId = req.swagger.params.periodId.value;
  FixCdr.getFromContractId(contractId, periodId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFixCdrs = function getFixCdrs(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  FixCdr.getFixCdrs(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
