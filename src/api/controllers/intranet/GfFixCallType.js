'use strict';

const utils = require('@utils/writer');
const GfFixCallType = require('@service/intranet/GfFixCallTypeService');

module.exports.createGfFixCallType = function createGfFixCallType(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;

  GfFixCallType.createGfFixCallType(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfFixCallTypes = function getGfFixCallTypes(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  GfFixCallType.getGfFixCallTypes(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfFixCallTypeById = function getGfFixCallTypeById(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  GfFixCallType.getGfFixCallTypeById(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateGfFixCallTypes = function updateGfFixCallTypes(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  GfFixCallType.updateGfFixCallTypes(id, req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteGfFixCallTypes = function deleteGfFixCallTypes(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  GfFixCallType.deleteGfFixCallTypes(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
