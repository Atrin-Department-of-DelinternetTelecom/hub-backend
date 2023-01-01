'use strict';

const utils = require('@utils/writer');
const BasicInformation = require('@service/hrms/BasicInformationService');

module.exports.deleteBasicinformationsId = function deleteBasicinformationsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  BasicInformation.deleteBasicinformationsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getBasicinformations = function getBasicinformations(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  BasicInformation.getBasicinformations(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getBasicinformationsId = function getBasicinformationsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  BasicInformation.getBasicinformationsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postBasicinformationsId = function postBasicinformationsId(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  BasicInformation.postBasicinformationsId(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putBasicinformationsId = function putBasicinformationsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  BasicInformation.putBasicinformationsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
