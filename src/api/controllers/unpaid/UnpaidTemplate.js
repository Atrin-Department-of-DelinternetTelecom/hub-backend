'use strict';

const utils = require('@utils/writer');
const UnpaidTemplate = require('@service/unpaid/UnpaidTemplateService');

module.exports.deleteUnpaidTemplatesId = function deleteUnpaidTemplatesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  UnpaidTemplate.deleteUnpaidTemplatesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUnpaidTemplates = function getUnpaidTemplates(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  UnpaidTemplate.getUnpaidTemplates(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUnpaidTemplatesId = function getUnpaidTemplatesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  UnpaidTemplate.getUnpaidTemplatesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postUnpaidTemplates = function postUnpaidTemplates(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  UnpaidTemplate.postUnpaidTemplates(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putUnpaidTemplatesId = function putUnpaidTemplatesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  UnpaidTemplate.putUnpaidTemplatesId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
