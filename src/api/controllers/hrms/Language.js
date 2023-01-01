'use strict';

const utils = require('@utils/writer');
const Language = require('@service/hrms/LanguageService');

module.exports.deleteLanguagesId = function deleteLanguagesId(req, res, next) {
  const id = req.swagger.params.id.value;
  Language.deleteLanguagesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLanguages = function getLanguages(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Language.getLanguages(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLanguagesId = function getLanguagesId(req, res, next) {
  const id = req.swagger.params.id.value;
  Language.getLanguagesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUserLanguagesId = function getUserLanguagesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Language.getUserLanguagesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postLanguages = function postLanguages(req, res, next) {
  const body = req.swagger.params.body.value;
  Language.postLanguages(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putLanguagesId = function putLanguagesId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Language.putLanguagesId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
