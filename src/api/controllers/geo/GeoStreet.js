/* eslint-disable you-dont-need-lodash-underscore/get */
'use strict';

const _ = require('lodash');
const axios = require('axios').default;

const utils = require('@utils/writer');
const GeoStreet = require('@service/geo/GeoStreetService');
const { updateStreets } = require('@service/geo/updateGeoService');
const { createRoute } = require('@utils/controller-factory');
const {
  respondOK,
  respondConflict,
  respondSuccess,
  respondInternalServerError,
  respondNotFound,
} = require('@utils/response');

const { errors } = require('@api/http/http_errors');

exports.update = createRoute({
  handler(req) {
    const cityId = req.swagger.params.id.value;
    const toWhich = { id: cityId };
    cityId !== 0 ? updateStreets(toWhich) : updateStreets();
    return respondOK('update is started');
  },
});

exports.getStreetTypesOfCity = (req, res) => {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  GeoStreet.getStreetTypesOfCity(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getGeoStreets = (req, res) => {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  GeoStreet.getGeoStreets(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getGeoStreetsByCityCode = (req, res) => {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  GeoStreet.getGeoStreetsByCityCode(
    req.swagger.params.cityCode.value,
    req.query,
  )
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getGeoStreetId = (req, res) => {
  const id = req.swagger.params.id.value;
  GeoStreet.getGeoStreetId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getGeoStreetByCode = (req, res) => {
  const code = req.swagger.params.code.value;
  GeoStreet.getGeoStreetByCode(code)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.postGeoStreets = (req, res) => {
  const body = req.swagger.params.body.value;
  GeoStreet.postGeoStreets(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.putGeoStreetId = (req, res) => {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  GeoStreet.putGeoStreetId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.coordinateToAddress = createRoute({
  async handler(req) {
    const latitude = req.swagger.params.latitude.value;
    const longitude = req.swagger.params.longitude.value;
    const mapBoxToken = process.env.MAPBOX_TOKEN;
    if (!mapBoxToken)
      return respondConflict('server error in mapService configuration');

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=address&language=en&access_token=${mapBoxToken}`;
    const mapBoxAdress = await axios.get(url);

    if (!mapBoxAdress.data)
      return respondInternalServerError(
        'server can not reach your awnser right now, please try later',
      );

    const mapBoxAddress = _.get(mapBoxAdress?.data?.features, [0], null);
    if (!mapBoxAddress)
      throw new errors.NotFound(`address with this location not found`);
    const addressString = String(_.get(mapBoxAddress, 'place_name', ''))
      .toLowerCase()
      .split(', ');

    const address = await GeoStreet.addressToGeoObject(addressString);
    return respondSuccess(address);
  },
});
