'use strict';

const utils = require('@utils/writer');
const Default = require('@service/DefaultService');

module.exports.getVacationsId = function getVacationsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Default.getVacationsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getVehiclesId = function getVehiclesId(req, res, next) {
  const id = req.swagger.params.id.value;
  Default.getVehiclesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
