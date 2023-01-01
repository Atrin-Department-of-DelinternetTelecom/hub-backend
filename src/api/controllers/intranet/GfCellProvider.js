'use strict';

const utils = require('@utils/writer');
const GfCellProvider = require('@service/intranet/GfCellProviderService');

module.exports.getGfCellProviders = function getGfCellProviders(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  GfCellProvider.getGfCellProviders(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
