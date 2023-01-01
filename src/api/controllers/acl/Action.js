'use strict';

const utils = require('@utils/writer');
const Action = require('@service/acl/ActionService');

module.exports.deleteActionsId = function deleteActionsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Action.deleteActionsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getActions = function getActions(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Action.getActions(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getActionsId = function getActionsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Action.getActionsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putActionsId = function putActionsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Action.putActionsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postActions = function postActions(req, res, next) {
  const body = req.swagger.params.body.value;
  Action.postActions(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
