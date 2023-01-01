'use strict';

const utils = require('@utils/writer');
const InvoiceProduct = require('@service/intranet/InvoiceProductService');

module.exports.createInvoiceProduct = function createInvoiceProduct(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;

  InvoiceProduct.createInvoiceProduct(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getInvoiceProduct = function getInvoiceProduct(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  InvoiceProduct.getInvoiceProduct(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getInvoiceProductById = function getInvoiceProductById(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  InvoiceProduct.getInvoiceProductById(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateInvoiceProduct = function updateInvoiceProduct(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  InvoiceProduct.updateInvoiceProduct(id, req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteInvoiceProduct = function deleteInvoiceProduct(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  InvoiceProduct.deleteInvoiceProduct(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
