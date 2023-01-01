'use strict';

const utils = require('@utils/writer');
const Order = require('@service/web/OrderService');

module.exports.deleteOrdersId = function deleteOrdersId(req, res, next) {
  const id = req.swagger.params.id.value;
  Order.deleteOrdersId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getOrders = function getOrders(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Order.getOrders(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getOrdersId = function getOrdersId(req, res, next) {
  const id = req.swagger.params.id.value;
  Order.getOrdersId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postOrders = function postOrders(req, res, next) {
  const body = req.swagger.params.body.value;
  Order.postOrders(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putOrdersId = function putOrdersId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Order.putOrdersId(id, body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.syncSheet = function syncSheet(req, res, next) {
  Order.syncSheet()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
