'use strict';

const utils = require('@utils/writer');
const GfKamailioProvider = require('@service/intranet/GfKamailioProviderService');

module.exports.getGfKamailioProviders = function getGfKamailioProviders(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  GfKamailioProvider.getGfKamailioProviders(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
