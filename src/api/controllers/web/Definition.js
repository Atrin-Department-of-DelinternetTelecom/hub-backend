'use strict';

const utils = require('@utils/writer');
const Definition = require('@service/web/DefinitionService');

module.exports.deleteDefinitionsId = function deleteDefinitionsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Definition.deleteDefinitionsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getDefinitions = function getDefinitions(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Definition.getDefinitions(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getDefinitionsId = function getDefinitionsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Definition.getDefinitionsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postDefinitions = function postDefinitions(req, res, next) {
  const body = req.swagger.params.body.value;
  Definition.postDefinitions(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putDefinitionsId = function putDefinitionsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Definition.putDefinitionsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
