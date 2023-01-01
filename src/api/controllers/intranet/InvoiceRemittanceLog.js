'use strict';

const utils = require('@utils/writer');
const InvoiceRemitanceLog = require('@service/intranet/InvoiceRemittanceLogService');

module.exports.postInvoiceRemitanceLogs = function postInvoiceRemitanceLogs(
  req,
  res,
  next,
) {
  InvoiceRemitanceLog.postInvoiceRemitanceLogs(req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getInvoiceRemitanceLogs = function getInvoiceRemitanceLogs(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  InvoiceRemitanceLog.getInvoiceRemitanceLogs(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getInvoiceRemitanceLogsId = function getInvoiceRemitanceLogsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  InvoiceRemitanceLog.getInvoiceRemitanceLogsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putInvoiceRemitanceLogsId = function putInvoiceRemitanceLogsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  InvoiceRemitanceLog.putInvoiceRemitanceLogsId(id, req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteInvoiceRemitanceLogsId =
  function deleteInvoiceRemitanceLogsId(req, res, next) {
    const id = req.swagger.params.id.value;

    InvoiceRemitanceLog.deleteInvoiceRemitanceLogsId(id)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };
