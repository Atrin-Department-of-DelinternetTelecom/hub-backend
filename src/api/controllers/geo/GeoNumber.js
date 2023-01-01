'use strict';

const utils = require('@utils/writer');
const GeoNumber = require('@service/geo/GeoNumberService');
const {
  updateNumber,
  updateNumbers,
  updateRcMeta,
  updateNumbersPerStreet,
} = require('@service/geo/updateGeoService');
const { createRoute } = require('@utils/controller-factory');
const { respondOK } = require('@utils/response');

exports.update = createRoute({
  handler(req) {
    updateNumbers();
    return respondOK('update is started');
  },
});

exports.updateFeatures = createRoute({
  handler() {
    updateRcMeta();
    return respondOK('update is started');
  },
});

exports.updateFeature = createRoute({
  handler(req) {
    const numberId = req.swagger.params.id?.value;
    updateRcMeta(numberId);
    return respondOK('update is started');
  },
});

exports.updateNumbersPerStreet = (req, res) => {
  const street_id = req.swagger.params.id.value;
  updateNumbersPerStreet(street_id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getGeoNumbers = (req, res) => {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  GeoNumber.getGeoNumbers(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getGeoNumbersByStreetCode = (req, res) => {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  GeoNumber.getGeoNumbersByStreetCode(
    req.swagger.params.streetCode.value,
    req.query,
  )
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getGeoNumberId = (req, res) => {
  const id = req.swagger.params.id.value;
  GeoNumber.getGeoNumberId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getGeoNumberByCode = (req, res) => {
  const code = req.swagger.params.code.value;
  GeoNumber.getGeoNumberByCode(code)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.postGeoNumber = (req, res) => {
  const body = req.swagger.params.body.value;
  GeoNumber.postGeoNumber(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.putGeoNumberId = (req, res) => {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  GeoNumber.putGeoNumberId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
