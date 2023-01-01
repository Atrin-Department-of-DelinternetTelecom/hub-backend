'use strict';

const utils = require('@utils/writer');
const InvoiceClient = require('@service/intranet/InvoiceClientService');
const { respondBadRequest, isResponsePayload } = require('@utils/response');

module.exports.deleteInvoiceClientsId = function deleteInvoiceClientsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  InvoiceClient.destroyInvoiceClientsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getInvoiceClients = function getInvoiceClients(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  InvoiceClient.getInvoiceClients(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getInvoiceClientsId = function getInvoiceClientsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  InvoiceClient.getInvoiceClientsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postInvoiceClients = function postInvoiceClients(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  InvoiceClient.postInvoiceClients(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putInvoiceClientsId = function putInvoiceClientsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  InvoiceClient.putInvoiceClientsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.syncInvoiceClientWithGfClient =
  function syncInvoiceClientWithGfClient(req, res, next) {
    InvoiceClient.syncInvoiceClientWithGfClient()
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };
