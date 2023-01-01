'use strict';

const utils = require('@utils/writer');
const FeeGroup = require('@service/intranet/GfFeeGroupService');
const GfContractsFeeChangeService = require('@service/intranet/GfContractsFeeChangeService');

module.exports.createGfFeeGroup = function createGfFeeGroup(req, res, next) {
  const body = req.swagger.params.body.value;

  FeeGroup.createGfFeeGroup(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfFeeGroups = function getGfFeeGroups(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  FeeGroup.getGfFeeGroups(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfFeeGroupsId = function getGfFeeGroupsId(req, res, next) {
  const id = req.swagger.params.id.value;
  FeeGroup.getGfFeeGroupsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateGfFeeGroup = function updateGfFeeGroup(req, res, next) {
  const id = req.swagger.params.id.value;

  FeeGroup.updateGfFeeGroup(id, req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteGfFeeGroup = function deleteGfFeeGroup(req, res, next) {
  const id = req.swagger.params.id.value;

  FeeGroup.deleteGfFeeGroup(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfFeeGroupSection = function getGfFeeGroupSection(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  FeeGroup.getGfFeeGroupSection(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfFeeGroupsWithFee = function getGfFeeGroupsWithFee(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  FeeGroup.getGfFeeGroupsWithFee(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getBonuses = function getBonuses(req, res, next) {
  const id = req.swagger.params.id.value;
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  FeeGroup.getBonuses(req.query, id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      console.log(response);
      utils.writeJson(res, response);
    });
};

module.exports.getCompatibleFeeGroups = function getCompatibleFeeGroups(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  GfContractsFeeChangeService.getCompatibleFeeGroups(parseInt(id))
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
