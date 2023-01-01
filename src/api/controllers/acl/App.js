'use strict';

const utils = require('@utils/writer');
const App = require('@service/acl/AppService');

module.exports.deleteAppsId = function deleteAppsId(req, res, next) {
  const id = req.swagger.params.id.value;
  App.deleteAppsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getApps = function getApps(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  App.getApps(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getAppsId = function getAppsId(req, res, next) {
  const id = req.swagger.params.id.value;
  App.getAppsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putAppsId = function putAppsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  App.putAppsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postApps = function postApps(req, res, next) {
  const body = req.swagger.params.body.value;
  App.postApps(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
