'use strict';

const utils = require('@utils/writer');
const GfCollaborator = require('@service/intranet/GfCollaboratorService');

module.exports.getGfCollaborators = function getGfCollaborators(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  GfCollaborator.getGfCollaborators(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
