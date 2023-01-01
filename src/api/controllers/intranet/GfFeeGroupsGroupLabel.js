'use strict';

const utils = require('@utils/writer');
const FeeGroupsGroupLabel = require('@service/intranet/GfFeeGroupsGroupLabelService');

module.exports.createGfFeegroupsGroupLabel =
  function createGfFeegroupsGroupLabel(req, res, next) {
    const body = req.swagger.params.body.value;

    FeeGroupsGroupLabel.createGfFeegroupsGroupLabel(body)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.getGfFeegroupsGroupLabels = function getGfFeegroupsGroupLabels(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  FeeGroupsGroupLabel.getGfFeegroupsGroupLabels(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfFeegroupsGroupLabelId = function getGfFeegroupsGroupLabelId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  FeeGroupsGroupLabel.getGfFeegroupsGroupLabelId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateGfFeegroupsGroupLabel =
  function updateGfFeegroupsGroupLabel(req, res, next) {
    const id = req.swagger.params.id.value;

    FeeGroupsGroupLabel.updateGfFeegroupsGroupLabel(id, req.body)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.deleteGfFeegroupsGroupLabel =
  function deleteGfFeegroupsGroupLabel(req, res, next) {
    const id = req.swagger.params.id.value;

    FeeGroupsGroupLabel.deleteGfFeegroupsGroupLabel(id)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };
