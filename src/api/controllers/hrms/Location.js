'use strict';

const utils = require('@utils/writer');
const Location = require('@service/hrms/LocationService');

module.exports.getLocationsPointinpolygon = function getLocationsPointinpolygon(
  req,
  res,
  next,
) {
  const geofence_id = req.swagger.params.geofence_id.value;
  const point = req.swagger.params.point.value.split(' ');

  Location.getLocationsPointinpolygon(geofence_id, [
    parseFloat(point[0]),
    parseFloat(point[1]),
  ])
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLocationsUser = function getLocationsUser(req, res, next) {
  Location.getLocationsUser()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLocationsVehicle = function getLocationsVehicle(
  req,
  res,
  next,
) {
  Location.getLocationsVehicle()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postLocations = function postLocations(req, res, next) {
  const body = req.swagger.params.body.value;
  Location.postLocations(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postLocationsPolygon = function postLocationsPolygon(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  Location.postLocationsPolygon(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
