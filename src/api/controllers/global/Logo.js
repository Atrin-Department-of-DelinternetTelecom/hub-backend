'use strict';

const utils = require('@utils/writer');
const Logo = require('@service/global/LogoService');
const { isResponsePayload } = require('@utils/response');

module.exports.downloadLogo = function downloadLogo(req, res, next) {
  Logo.downloadLogo(req.query.isIcon).then(function (response) {
    if (isResponsePayload(response)) {
      utils.writeJson(res, response);
    } else {
      res.download(response);
    }
  });
};

module.exports.uploadLogo = function uploadLogo(req, res, next) {
  Logo.uploadLogo(req.files.image, req.body.isIcon)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
