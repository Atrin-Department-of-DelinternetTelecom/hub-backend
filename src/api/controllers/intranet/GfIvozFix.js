'use strict';

const utils = require('@utils/writer');
const GfIvozFix = require('@service/intranet/GfIvozFixService');

module.exports.deleteGfIvozFixesId = function deleteGfIvozFixesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  GfIvozFix.destroyGfIvozFixesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfIvozFixes = function getGfIvozFixes(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  GfIvozFix.getGfIvozFixes(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfIvozFixesId = function getGfIvozFixesId(req, res, next) {
  const id = req.swagger.params.id.value;
  GfIvozFix.getGfIvozFixesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postGfIvozFixes = function postGfIvozFixes(req, res, next) {
  const body = req.swagger.params.body.value;
  GfIvozFix.postGfIvozFixes(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putGfIvozFixesId = function putGfIvozFixesId(req, res, next) {
  const id = req.swagger.params.id.value;
  GfIvozFix.putGfIvozFixesId(id, req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
