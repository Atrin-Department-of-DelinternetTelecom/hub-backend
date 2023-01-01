'use strict';

const utils = require('@utils/writer');
const InvoiceTaxType = require('@service/intranet/InvoiceTaxTypeService');

module.exports.deleteInvoiceTaxTypesId = function deleteInvoiceTaxTypesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  InvoiceTaxType.destroyInvoiceTaxTypeId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getInvoiceTaxTypes = function getInvoiceTaxTypes(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  InvoiceTaxType.getInvoiceTaxTypes(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getInvoiceTaxTypeId = function getInvoiceTaxTypeId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  InvoiceTaxType.getInvoiceTaxTypeId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postInvoiceTaxType = function postInvoiceTaxType(
  req,
  res,
  next,
) {
  InvoiceTaxType.postInvoiceTaxType(req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putInvoiceTaxTypeId = function putInvoiceTaxTypeId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  InvoiceTaxType.putInvoiceTaxTypeId(id, req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
