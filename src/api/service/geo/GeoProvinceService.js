'use strict';

const { errors } = require('@api/http/http_errors');
const {
  system: { GeoProvince, GeoCountry },
} = require('@models');
const {
  getAllEntities,
  findAndUpdateNoInclude,
  findAndGet,
} = require('@utils/request-handler');

const assert = require('node:assert');
const { respondSuccess } = require('@utils/response');

/**
 * Your GET endpoint
 * get all GeoProvinces(information) record
 *
 * returns Object
 **/
exports.getGeoProvinces = async function (query) {
  return getAllEntities(query, GeoProvince);
};

/**
 * Your GET endpoint
 * get single GeoProvince record by id
 *
 * id String
 * returns Object
 **/
exports.getGeoProvinceId = async function (id) {
  return findAndGet(id, GeoProvince, [
    {
      model: GeoCountry,
      require: true,
      attributes: ['id', 'name'],
    },
  ]);
};

/**
 * Your GET endpoint
 * get single GeoProvince record by id
 *
 * id String
 * returns Object
 **/
exports.getGeoProvinceByCode = async function (code) {
  const province = await GeoProvince.findOne({
    where: { code },
    include: [
      {
        model: GeoCountry,
        require: true,
        attributes: ['id', 'name'],
      },
    ],
  });

  assert(province, new errors.NotFound());

  return respondSuccess(province);
};

/**
 *
 * update a GeoProvince record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected GeoProvince (optional)
 * returns Object
 **/
exports.putGeoProvinceId = async function (id, body) {
  return findAndUpdateNoInclude(id, body, GeoProvince);
};
