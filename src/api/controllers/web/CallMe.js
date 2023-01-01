'use strict';

const utils = require('@utils/writer');
const CallMe = require('@service/web/CallMeService');

module.exports.deleteCallMesId = function deleteCallMesId(req, res, next) {
  const id = req.swagger.params.id.value;
  CallMe.deleteCallMesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCallMes = function getCallMes(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  CallMe.getCallMes(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCallMesId = function getCallMesId(req, res, next) {
  const id = req.swagger.params.id.value;
  CallMe.getCallMesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postCallMes = function postCallMes(req, res, next) {
  const body = req.swagger.params.body.value;
  CallMe.postCallMes(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putCallMesId = function putCallMesId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  CallMe.putCallMesId(id, body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.visitCallMesId = function visitCallMesId(req, res, next) {
  CallMe.visitCallMesId(req.swagger.params.id.value, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.syncSheet = function syncSheet(req, res, next) {
  CallMe.syncSheet()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
