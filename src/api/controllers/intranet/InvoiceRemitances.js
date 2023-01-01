'use strict';

const utils = require('@utils/writer');
const InvoiceRemitances = require('@service/intranet/InvoiceRemitancesService');

const { isResponsePayload } = require('@utils/response');

module.exports.createInvoiceRemitance = function createInvoiceRemitance(
  req,
  res,
  next,
) {
  InvoiceRemitances.createInvoiceRemitance(req.body, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getInvoiceRemitances = function getInvoiceRemitances(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  InvoiceRemitances.getInvoiceRemitances(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getInvoiceRemitanceById = function getInvoiceRemitanceById(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  InvoiceRemitances.getInvoiceRemitanceById(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateInvoiceRemitance = function updateInvoiceRemitance(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  InvoiceRemitances.updateInvoiceRemitance(id, req.body, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteInvoiceRemitance = function deleteInvoiceRemitance(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  InvoiceRemitances.deleteInvoiceRemitance(id, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.setConfirmed = function setConfirmed(req, res, next) {
  const id = req.swagger.params.id.value;

  InvoiceRemitances.setConfirmed(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGlobalAbstract = function getGlobalAbstract(req, res, next) {
  InvoiceRemitances.getGlobalAbstract()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.generateFile = function generateFile(req, res, next) {
  const id = req.swagger.params.id.value;
  InvoiceRemitances.generateFile(id, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.fixUnsettedRemittance = function fixUnsettedRemittance(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  InvoiceRemitances.fixUnsettedRemittance(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
