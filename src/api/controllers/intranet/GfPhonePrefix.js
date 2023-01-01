'use strict';

const utils = require('@utils/writer');
const GfPhonePrefix = require('@service/intranet/GfPhonePrefixService');

module.exports.getGfPhonePrefix = function getGfPhonePrefix(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  GfPhonePrefix.getGfPhonePrefix(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
