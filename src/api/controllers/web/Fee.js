'use strict';

const utils = require('@utils/writer');
const Fee = require('@service/web/FeeService');

module.exports.deleteFeesId = function deleteFeesId(req, res, next) {
  const id = req.swagger.params.id.value;
  Fee.deleteFeesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFees = function getFees(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Fee.getFees(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFeesId = function getFeesId(req, res, next) {
  const id = req.swagger.params.id.value;
  Fee.getFeesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postFees = function postFees(req, res, next) {
  const body = req.swagger.params.body.value;
  Fee.postFees(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putFeesId = function putFeesId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Fee.putFeesId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
