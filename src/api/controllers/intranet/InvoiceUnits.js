'use strict';

const utils = require('@utils/writer');
const InvoiceUnits = require('@service/intranet/InvoiceUnitsService');

module.exports.deleteInvoiceUnitsId = function deleteInvoiceUnitsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  InvoiceUnits.destroyInvoiceUnitsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getInvoiceUnits = function getInvoiceUnits(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  InvoiceUnits.getInvoiceUnits(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getInvoiceUnitsId = function getInvoiceUnitsId(req, res, next) {
  const id = req.swagger.params.id.value;

  InvoiceUnits.getInvoiceUnitsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postInvoiceUnits = function postInvoiceUnits(req, res, next) {
  InvoiceUnits.postInvoiceUnits(req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putInvoiceUnitsId = function putInvoiceUnitsId(req, res, next) {
  const id = req.swagger.params.id.value;

  InvoiceUnits.putInvoiceUnitsId(id, req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
