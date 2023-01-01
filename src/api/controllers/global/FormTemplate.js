'use strict';

const utils = require('@utils/writer');
const FormTemplate = require('@service/global/FormTemplateService');

module.exports.deleteFormTemplatesId = function deleteFormTemplatesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  FormTemplate.deleteFormTemplatesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFormTemplates = function getFormTemplates(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  FormTemplate.getFormTemplates(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFormTemplatesId = function getFormTemplatesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  FormTemplate.getFormTemplatesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putFormTemplatesId = function putFormTemplatesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  FormTemplate.putFormTemplatesId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postFormTemplates = function postFormTemplates(req, res, next) {
  const body = req.swagger.params.body.value;
  FormTemplate.postFormTemplates(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
