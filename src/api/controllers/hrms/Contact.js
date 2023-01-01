'use strict';

const utils = require('@utils/writer');
const Contact = require('@service/hrms/ContactService');

module.exports.deleteContactsId = function deleteContactsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Contact.deleteContactsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getContacts = function getContacts(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Contact.getContacts(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getContactsId = function getContactsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Contact.getContactsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUserContactsId = function getUserContactsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Contact.getUserContactsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postContacts = function postContacts(req, res, next) {
  const body = req.swagger.params.body.value;
  Contact.postContacts(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putContactsId = function putContactsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Contact.putContactsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
