'use strict';

const utils = require('@utils/writer');
const FeeGroupsLabel = require('@service/intranet/GfFeeGroupsLabelService');

module.exports.createGfFeeGrouplabel = function createGfFeeGrouplabel(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;

  FeeGroupsLabel.createGfFeeGrouplabel(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfFeegroupsLabels = function getGfFeegroupsLabels(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  FeeGroupsLabel.getGfFeegroupsLabels(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfFeegroupsLabelId = function getGfFeegroupsLabelId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  FeeGroupsLabel.getGfFeegroupsLabelId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateGfFeegroupsLabel = function updateGfFeegroupsLabel(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  FeeGroupsLabel.updateGfFeegroupsLabel(id, req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteGfFeegroupsLabel = function deleteGfFeegroupsLabel(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  FeeGroupsLabel.deleteGfFeegroupsLabel(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
