'use strict';

const utils = require('@utils/writer');
const warehouse = require('@service/inventory/WarehouseService');

module.exports.deleteWarehouseById = function deleteWarehouseById(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  warehouse
    .deleteWarehouseById(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getWarehouses = function getWarehouses(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  warehouse
    .getWarehouses(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getWarehousesById = function getWarehousesById(req, res, next) {
  const id = req.swagger.params.id.value;
  warehouse
    .getWarehousesById(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postWarehouses = function postWarehouses(req, res, next) {
  const body = req.swagger.params.body.value;
  warehouse
    .postWarehouses(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putWarehousesId = function putWarehousesId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  warehouse
    .putWarehousesId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
