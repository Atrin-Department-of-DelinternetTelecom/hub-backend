'use strict';

const utils = require('@utils/writer');
const Text = require('@service/web/TextService');

module.exports.deleteTextsId = function deleteTextsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Text.deleteTextsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTexts = function getTexts(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Text.getTexts(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTextsId = function getTextsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Text.getTextsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postTexts = function postTexts(req, res, next) {
  const body = req.swagger.params.body.value;
  Text.postTexts(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putTextsId = function putTextsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Text.putTextsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
