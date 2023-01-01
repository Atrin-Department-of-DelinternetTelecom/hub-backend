'use strict';

const utils = require('@utils/writer');
const Pack = require('@service/web/PackService');

module.exports.deletePacksId = function deletePacksId(req, res, next) {
  const id = req.swagger.params.id.value;
  Pack.deletePacksId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getPacks = function getPacks(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Pack.getPacks(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getPacksId = function getPacksId(req, res, next) {
  const id = req.swagger.params.id.value;
  Pack.getPacksId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postPacks = function postPacks(req, res, next) {
  const body = req.swagger.params.body.value;
  Pack.postPacks(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putPacksId = function putPacksId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Pack.putPacksId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
