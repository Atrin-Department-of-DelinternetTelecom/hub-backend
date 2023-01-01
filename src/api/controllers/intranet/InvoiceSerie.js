'use strict';

const utils = require('@utils/writer');
const InvoiceSerie = require('@service/intranet/InvoiceSerieService');

module.exports.deleteInvoiceSeriesId = function deleteInvoiceSeriesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  InvoiceSerie.destroyInvoiceSeriesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getInvoiceSeries = function getInvoiceSeries(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  InvoiceSerie.getInvoiceSeries(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getInvoiceSeriesId = function getInvoiceSeriesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  InvoiceSerie.getInvoiceSeriesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postInvoiceSeries = function postInvoiceSeries(req, res, next) {
  InvoiceSerie.postInvoiceSeries(req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putInvoiceSeriesId = function putInvoiceSeriesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  InvoiceSerie.putInvoiceSeriesId(id, req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
