'use strict';

const utils = require('@utils/writer');
const ControlRow = require('@service/intranet/GfInvoiceControlService');
const Contract = require('@service/intranet/GfContractService');

module.exports.deleteGfInvoiceControlsId = function deleteGfInvoiceControlsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  ControlRow.deleteGfInvoiceControlsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfInvoiceControls = function getGfInvoiceControls(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  ControlRow.getGfInvoiceControls(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfInvoiceControlsId = function getGfInvoiceControlId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  ControlRow.getGfInvoiceControlsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postGfInvoiceControls = function postGfInvoiceControls(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  ControlRow.postGfInvoiceControls(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putGfInvoiceControlsId = function putGfInvoiceControlsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  ControlRow.putGfInvoiceControlsId(id, req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfInvoiceControlsThrowbackId =
  function getGfInvoiceControlsThrowbackId(req, res, next) {
    const id = req.swagger.params.id.value;
    ControlRow.getGfInvoiceControlsThrowbackId(id, req.user.userId)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.getGfInvoiceControlsInvoicedId =
  function getGfInvoiceControlsInvoicedId(req, res, next) {
    const id = req.swagger.params.id.value;
    ControlRow.getGfInvoiceControlsInvoicedId(id, req.user.userId)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };
