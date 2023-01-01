'use strict';

const utils = require('@utils/writer');
const GfCapexTypes = require('@service/intranet/GfCapexTypesService');

module.exports.getGfCapexTypes = function getGfCapexTypes(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  GfCapexTypes.getGfCapexTypes(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
