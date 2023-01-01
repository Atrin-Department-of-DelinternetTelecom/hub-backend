'use strict';

const utils = require('@utils/writer');
const GeoProvince = require('@service/geo/GeoProvinceService');
const { updateProvinces } = require('@service/geo/updateGeoService');
const { createRoute } = require('@utils/controller-factory');
const { respondOK } = require('@utils/response');

exports.update = createRoute({
  handler(req) {
    const countryId = req.swagger.params.id.value;
    countryId === 0 ? updateProvinces(1, 0) : updateProvinces(countryId, 1);
    return respondOK('update is started');
  },
});

exports.getGeoProvinces = (req, res) => {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  GeoProvince.getGeoProvinces(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getGeoProvinceId = (req, res) => {
  const id = req.swagger.params.id.value;
  GeoProvince.getGeoProvinceId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getGeoProvinceByCode = (req, res) => {
  const code = req.swagger.params.code.value;
  GeoProvince.getGeoProvinceByCode(code)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.putGeoProvinceId = (req, res) => {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  GeoProvince.putGeoProvinceId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
