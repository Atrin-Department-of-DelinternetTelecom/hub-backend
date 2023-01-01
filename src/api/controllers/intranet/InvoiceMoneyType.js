'use strict';

const utils = require('@utils/writer');
const InvoiceMoneyType = require('@service/intranet/InvoiceMoneyTypeService');

module.exports.createInvoiceMoneyType = function createInvoiceMoneyType(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;

  InvoiceMoneyType.createInvoiceMoneyType(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getInvoiceMoneyTypes = function getInvoiceMoneyTypes(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  InvoiceMoneyType.getInvoiceMoneyTypes(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getInvoiceMoneyTypeById = function getInvoiceMoneyTypeById(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  InvoiceMoneyType.getInvoiceMoneyTypeById(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateInvoiceMoneyType = function updateInvoiceMoneyType(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  InvoiceMoneyType.updateInvoiceMoneyType(id, req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteInvoiceMoneyTypes = function deleteInvoiceMoneyTypes(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  InvoiceMoneyType.deleteInvoiceMoneyTypes(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
