'use strict';

const utils = require('@utils/writer');
const FeeGroup = require('@service/intranet/GfFeeGroupService');

module.exports.deleteFeeGroupsId = function deleteFeeGroupsId(req, res, next) {
  const id = req.swagger.params.id.value;
  FeeGroup.deleteFeeGroupsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFeeGroups = function getFeeGroups(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  FeeGroup.getFeeGroups(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFeeGroupsId = function getFeeGroupsId(req, res, next) {
  const id = req.swagger.params.id.value;
  FeeGroup.getFeeGroupsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postFeeGroups = function postFeeGroups(req, res, next) {
  const body = req.swagger.params.body.value;
  FeeGroup.postFeeGroups(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putFeeGroupsId = function putFeeGroupsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  FeeGroup.putFeeGroupsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
