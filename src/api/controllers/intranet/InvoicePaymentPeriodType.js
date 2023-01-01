'use strict';

const utils = require('@utils/writer');
const InvoicePaymentPeriodType = require('@service/intranet/InvoicePaymentPeriodTypeService');

module.exports.createPaymentPeriodType = function createPaymentPeriodType(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;

  InvoicePaymentPeriodType.createPaymentPeriodType(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getPaymentPeriodType = function getPaymentPeriodType(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  InvoicePaymentPeriodType.getPaymentPeriodType(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getPaymentPeriodTypeById = function getPaymentPeriodTypeById(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  InvoicePaymentPeriodType.getPaymentPeriodTypeById(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updatePaymentPeriodType = function updatePaymentPeriodType(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  InvoicePaymentPeriodType.updatePaymentPeriodType(id, req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deletePaymentPeriodType = function deletePaymentPeriodType(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  InvoicePaymentPeriodType.deletePaymentPeriodType(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
