'use strict';

const utils = require('@utils/writer');
const LocationHistory = require('@service/hrms/LocationHistoryService');

module.exports.deleteLocationHistoriesId = function deleteLocationHistoriesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  LocationHistory.deleteLocationHistoriesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLocationHistories = function getLocationHistories(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  LocationHistory.getLocationHistories(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLocationHistoriesId = function getLocationHistoriesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  LocationHistory.getLocationHistoriesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postLocationHistories = function postLocationHistories(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  LocationHistory.postLocationHistories(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putLocationHistoriesId = function putLocationHistoriesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  LocationHistory.putLocationHistoriesId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
