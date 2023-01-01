'use strict';

const utils = require('@utils/writer');
const GfSection = require('@service/intranet/GfSectionService');

module.exports.getGfSections = function getGfSections(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  GfSection.getGfSections(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
