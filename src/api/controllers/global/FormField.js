'use strict';

const utils = require('@utils/writer');
const FormField = require('@service/global/FormFieldService');

module.exports.deleteFormFieldsId = function deleteFormFieldsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  FormField.deleteFormFieldsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFormFields = function getFormFields(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  FormField.getFormFields(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFormFieldsId = function getFormFieldsId(req, res, next) {
  const id = req.swagger.params.id.value;
  FormField.getFormFieldsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putFormFieldsId = function putFormFieldsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  FormField.putFormFieldsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postFormFields = function postFormFields(req, res, next) {
  const body = req.swagger.params.body.value;
  FormField.postFormFields(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
