'use strict';

const utils = require('@utils/writer');
const GfInstallationService = require('@service/intranet/GfInstallationService');

exports.getAllInstallation = function getAllInstallation(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  GfInstallationService.getAllInstallation(req.query, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
