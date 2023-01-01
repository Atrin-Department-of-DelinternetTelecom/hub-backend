'use strict';

const utils = require('@utils/writer');
const InvoicePaymentType = require('@service/intranet/InvoicePaymentTypeService');

module.exports.deleteInvoicePaymentTypesId =
  function deleteInvoicePaymentTypesId(req, res, next) {
    const id = req.swagger.params.id.value;
    InvoicePaymentType.destroyInvoicePaymentTypesId(id)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.getInvoicePaymentTypes = function getInvoicePaymentTypes(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  InvoicePaymentType.getInvoicePaymentTypes(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getInvoicePaymentTypesId = function getInvoicePaymentTypesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  InvoicePaymentType.getInvoicePaymentTypesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postInvoicePaymentTypes = function postInvoicePaymentTypes(
  req,
  res,
  next,
) {
  InvoicePaymentType.postInvoicePaymentTypes(req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putInvoicePaymentTypesId = function putInvoicePaymentTypesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  InvoicePaymentType.putInvoicePaymentTypesId(id, req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
