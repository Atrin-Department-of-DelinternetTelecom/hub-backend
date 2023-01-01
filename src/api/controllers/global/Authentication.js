'use strict';
const Authentication = require('@service/global/AuthenticationService');
module.exports.postLogin = function postLogin(req, res, next) {
  const body = req.swagger.params.body.value;
  Authentication.postLogin(body, res, next);
};

module.exports.getLogout = function getLogout(req, res, next) {
  Authentication.getLogout();
};

module.exports.refreshToken = function refreshToken(req, res, next) {
  Authentication.refreshToken(req.user, res, next);
};
