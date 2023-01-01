'use strict';

const {
  intranet: { Warehouse },
} = require('@models');

const {
  getAllEntities,
  createCatch,
  findAndGet,
  findAndUpdate,
  findAndDeleteIntranet,
} = require('@utils/request-handler');

exports.deleteWarehouseById = async function (id) {
  return findAndDeleteIntranet(id, Warehouse);
};

exports.getWarehouses = async function (query) {
  return getAllEntities(query, Warehouse);
};

exports.getWarehousesById = async function (id) {
  return findAndGet(id, Warehouse);
};

exports.postWarehouses = async function (body) {
  return createCatch(body, Warehouse);
};

exports.putWarehousesId = async function (id, body) {
  return findAndUpdate(id, body, Warehouse);
};
