'use strict';

const utils = require('@utils/writer');
const GfUser = require('@service/intranet/GfUserService');

module.exports.getGfUsers = function getGfUsers(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  GfUser.getGfUsers(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfUsersId = function getGfUsersId(req, res, next) {
  const id = req.swagger.params.id.value;
  GfUser.getGfUsersId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfUsersNotInSystem = function getGfUsersNotInSystem(
  req,
  res,
  next,
) {
  GfUser.getGfUsersNotInSystem()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putGfUsersId = function putGfUsersId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  GfUser.putGfUsersId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
