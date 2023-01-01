'use strict';

const utils = require('@utils/writer');
const GeoCity = require('@service/geo/GeoCityService');
const { updateCities } = require('@service/geo/updateGeoService');
const { createRoute } = require('@utils/controller-factory');
const { respondOK } = require('@utils/response');

exports.update = createRoute({
  handler(req, res) {
    const provinceId = req.swagger.params.id.value;
    const toWhich = { id: provinceId };
    provinceId !== 0 ? updateCities(toWhich) : updateCities();
    return respondOK('update is started');
  },
});

exports.getPostalCodesOfCity = (req, res) => {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  GeoCity.getCityPostalCodes(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getGeoCities = (req, res) => {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  GeoCity.getGeoCities(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getGeoCitiesByProvinceCode = (req, res) => {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  GeoCity.getGeoCitiesByProvinceCode(
    req.swagger.params.provinceCode.value,
    req.query,
  )
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getGeoCityId = (req, res) => {
  const id = req.swagger.params.id.value;
  GeoCity.getGeoCityId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getGeoCityByCode = (req, res) => {
  const code = req.swagger.params.code.value;
  GeoCity.getGeoCityByCode(code)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.putGeoCityId = (req, res) => {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  GeoCity.putGeoCityId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
