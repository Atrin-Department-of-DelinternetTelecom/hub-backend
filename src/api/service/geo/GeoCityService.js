'use strict';

const { respondNotFound, respondSuccess } = require('@api/utils/response');
const assert = require('assert');
const {
  system: { GeoCity, GeoProvince },
} = require('@models');
const { getAllRows } = require('@utils/knex/table');

const knex = require('@lib/knex').system;

const {
  getAllEntities,
  findAndUpdateNoInclude,
  findAndGet,
} = require('@utils/request-handler');
const { errors } = require('@api/http/http_errors');

/**
 * Your GET endpoint
 * get all GeoCity(information) record
 *
 * returns Object
 **/
exports.getGeoCities = async (query) => {
  return getAllEntities(query, GeoCity, undefined, [
    { model: GeoProvince, as: 'GeoProvince' },
  ]);
};

/**
 * Your GET endpoint
 * get all GeoCity(information) record
 *
 * returns Object
 **/
exports.getGeoCitiesByProvinceCode = async (provinceCode, query) => {
  return getAllEntities(query, GeoCity, undefined, [
    {
      model: GeoProvince,
      as: 'GeoProvince',
      where: { code: provinceCode },
      required: true,
    },
  ]);
};

/**
 * Your GET endpoint
 * get single GeoCity record by id
 *
 * id String
 * returns Object
 **/
exports.getGeoCityId = async (id) => {
  return findAndGet(id, GeoCity, [
    {
      model: GeoProvince,
      require: true,
      attributes: ['id', 'name'],
    },
  ]);
};

exports.getGeoCityByCode = async function (code) {
  const city = await GeoCity.findOne({
    where: { code },
    include: [
      {
        model: GeoProvince,
        require: true,
        attributes: ['id', 'name'],
      },
    ],
  });

  assert(city, new errors.NotFound());

  return respondSuccess(city);
};
/**
 *
 * update a GeoCity record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected GeoCity (optional)
 * returns Object
 **/
exports.putGeoCityId = async (id, body) => {
  return findAndUpdateNoInclude(id, body, GeoCity);
};

exports.getCityPostalCodes = async (query) => {
  const { city_code, ...q } = query;

  const sql = knex('geo_streets')
    .distinct('geo_numbers.postal_code')
    .leftJoin('geo_numbers', {
      'geo_numbers.street_id': 'geo_streets.id',
    })
    .whereNot({ 'geo_numbers.postal_code': '' });
  if (city_code) {
    const city = await GeoCity.findOne({ where: { code: city_code } });
    if (city)
      sql.where({
        'geo_streets.city_id': city.id,
      });
  }

  return getAllRows({ sql, query: q, knex });
};
