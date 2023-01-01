'use strict';

const utils = require('@utils/writer');
const MoozaicUser = require('@service/moozaic/MoozaicUserService');

module.exports.getMoozaicUsersId = function getMoozaicUsersId(req, res, next) {
  const id = req.swagger.params.id.value;
  MoozaicUser.getMoozaicUsersId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getMoozaicUsers = function getMoozaicUsers(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  MoozaicUser.getMoozaicUsers(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putMoozaicUsersId = function putMoozaicUsersId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  MoozaicUser.putMoozaicUsersId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
