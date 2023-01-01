'use strict';

const utils = require('@utils/writer');
const InvoiceInvoice = require('@service/intranet/GfInvoiceLineService');

module.exports.deleteGfInvoiceLinesId = function deleteGfInvoiceLinesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  InvoiceInvoice.deleteGfInvoiceLinesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfInvoiceLines = function getGfInvoiceLines(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  InvoiceInvoice.getGfInvoiceLines(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfInvoiceLinesId = function getGfInvoiceLinesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  InvoiceInvoice.getGfInvoiceLinesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postGfInvoiceLines = function postGfInvoiceLines(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  InvoiceInvoice.postGfInvoiceLines(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putGfInvoiceLinesId = function putGfInvoiceLinesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  InvoiceInvoice.putGfInvoiceLinesId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
