'use strict';

const utils = require('@utils/writer');
const Form = require('@service/global/FormService');

module.exports.deleteFormsId = function deleteFormsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Form.deleteFormsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getForms = function getForms(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Form.getForms(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFormsId = function getFormsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Form.getFormsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putFormsId = function putFormsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Form.putFormsId(id, req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postForms = function postForms(req, res, next) {
  const body = req.body;
  const files = req.files;
  Form.postForms({ ...body, ...files }, 1) // should be change
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
