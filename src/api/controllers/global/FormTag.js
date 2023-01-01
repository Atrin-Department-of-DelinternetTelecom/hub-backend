'use strict';

const utils = require('@utils/writer');
const FormTag = require('@service/global/FormTagService');

module.exports.deleteFormTagsId = function deleteFormTagsId(req, res, next) {
  const id = req.swagger.params.id.value;
  FormTag.deleteFormsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFormTags = function getFormTags(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  FormTag.getFormTags(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFormTagsId = function getFormTagsId(req, res, next) {
  const id = req.swagger.params.id.value;
  FormTag.getFormTagsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putFormTagsId = function putFormTagsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  FormTag.putFormTagsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postFormTags = function postFormTags(req, res, next) {
  const body = req.swagger.params.body.value;
  FormTag.postFormTags(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
