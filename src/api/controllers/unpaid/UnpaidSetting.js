'use strict';

const utils = require('@utils/writer');
const UnpaidSetting = require('@service/unpaid/UnpaidSettingService');

module.exports.deleteUnpaidSettingsId = function deleteUnpaidSettingsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  UnpaidSetting.deleteUnpaidSettingsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUnpaidSettings = function getUnpaidSettings(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  UnpaidSetting.getUnpaidSettings(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUnpaidSettingsId = function getUnpaidSettingsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  UnpaidSetting.getUnpaidSettingsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postUnpaidSettings = function postUnpaidSettings(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  UnpaidSetting.postUnpaidSettings(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putUnpaidSettingsId = function putUnpaidSettingsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  UnpaidSetting.putUnpaidSettingsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
