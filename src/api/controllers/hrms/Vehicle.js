'use strict';

const utils = require('@utils/writer');
const Vehicle = require('@service/hrms/VehicleService');

module.exports.deleteVehiclesId = function deleteVehiclesId(req, res, next) {
  const id = req.swagger.params.id.value;
  Vehicle.deleteVehiclesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getVehicles = function getVehicles(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Vehicle.getVehicles(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getVehiclesId = function getVehiclesId(req, res, next) {
  const id = req.swagger.params.id.value;
  Vehicle.getVehiclesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postVehicleUser = function postVehicleUser(req, res, next) {
  Vehicle.postVehicleUser(req.body, req.user.id)
    .then(function (vehicleUser) {
      Vehicle.attachMediaToVehicleUser(req.files, vehicleUser);
      utils.writeJson(res, vehicleUser);
    })
    .catch(function (vehicleUser) {
      utils.writeJson(res, vehicleUser);
    });
};

module.exports.postVehicles = function postVehicles(req, res, next) {
  const body = req.swagger.params.body.value;
  Vehicle.postVehicles(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putVehiclesId = function putVehiclesId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Vehicle.putVehiclesId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
