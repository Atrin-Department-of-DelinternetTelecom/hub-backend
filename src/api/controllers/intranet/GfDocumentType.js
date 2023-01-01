'use strict';

const utils = require('@utils/writer');
const GfDocumentType = require('@service/intranet/GfDocumentTypeService');

module.exports.deleteGfDocumentTypesId = function deleteGfDocumentTypesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  GfDocumentType.destroyGfDocumentTypesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfDocumentTypes = function getGfDocumentTypes(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  GfDocumentType.getGfDocumentTypes(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfDocumentTypesId = function getGfDocumentTypesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  GfDocumentType.getGfDocumentTypesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postGfDocumentTypes = function postGfDocumentTypes(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  GfDocumentType.postGfDocumentTypes(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putGfDocumentTypesId = function putGfDocumentTypesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  GfDocumentType.putGfDocumentTypesId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
