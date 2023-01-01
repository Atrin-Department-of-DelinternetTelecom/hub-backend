'use strict';

const utils = require('@utils/writer');
const InvoiceClientsContact = require('@service/intranet/InvoiceClientsContactService');

module.exports.deleteInvoiceClientsContactsId =
  function deleteInvoiceClientsContactsId(req, res, next) {
    const id = req.swagger.params.id.value;
    InvoiceClientsContact.destroyInvoiceClientsContactsId(id)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.getInvoiceClientsContacts = function getInvoiceClientsContacts(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  InvoiceClientsContact.getInvoiceClientsContacts(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getInvoiceClientsContactsId =
  function getInvoiceClientsContactsId(req, res, next) {
    const id = req.swagger.params.id.value;
    InvoiceClientsContact.getInvoiceClientsContactsId(id)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.postInvoiceClientsContacts = function postInvoiceClientsContacts(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  InvoiceClientsContact.postInvoiceClientsContacts(req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putInvoiceClientsContactsId =
  function putInvoiceClientsContactsId(req, res, next) {
    const id = req.swagger.params.id.value;
    const body = req.swagger.params.body.value;
    InvoiceClientsContact.putInvoiceClientsContactsId(id, body)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };
