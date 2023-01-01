'use strict';

const { errors } = require('@api/http/http_errors');
const assert = require('assert');
const {
  system: { GeoNumber, GeoStreet, GeoCity, GeoProvince },
} = require('@models');
const {
  createCatch,
  findAndUpdateNoInclude,
  findAndGet,
  getAllEntities,
} = require('@utils/request-handler');
const {
  respondBadRequest,
  respondNotFound,
  respondCreated,
  respondSuccess,
} = require('@utils/response');

/**
 * Your GET endpoint
 * get all GeoNumbers(information) record
 *
 * returns Object
 **/
exports.getGeoNumbers = async (query) => {
  return getAllEntities(query, GeoNumber, undefined, [
    {
      model: GeoStreet,
      attributes: [
        'id',
        'name',
        'type',
        'formated_type',
        'ine_province_code',
        'ine_city_code',
        'mhap_city_code',
        'catalanType',
        'code',
      ],
      as: 'GeoStreet',
      include: [
        {
          model: GeoCity,
          require: true,
          attributes: ['id', 'name'],
          include: [
            {
              model: GeoProvince,
              require: true,
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
    },
  ]);
};

exports.getGeoNumbersByStreetCode = async (streetCode, query) => {
  return getAllEntities(query, GeoNumber, undefined, [
    {
      model: GeoStreet,
      attributes: [
        'id',
        'name',
        'type',
        'formated_type',
        'ine_province_code',
        'ine_city_code',
        'mhap_city_code',
        'catalanType',
        'code',
      ],
      as: 'GeoStreet',
      required: true,
      where: { code: streetCode },
      include: [
        {
          model: GeoCity,
          require: true,
          attributes: ['id', 'name'],
          include: [
            {
              model: GeoProvince,
              require: true,
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
    },
  ]);
};

/**
 * Your GET endpoint
 * get single GeoNumber record by id
 *
 * id String
 * returns Object
 **/
exports.getGeoNumberId = async (id) => {
  return findAndGet(id, GeoNumber, [
    {
      model: GeoStreet,
      require: true,
      attributes: ['id', 'name', 'type', 'catalanType'],
      include: [
        {
          model: GeoCity,
          require: true,
          attributes: ['id', 'name'],
          include: [
            {
              model: GeoProvince,
              require: true,
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
    },
  ]);
};

exports.getGeoNumberByCode = async (code) => {
  const number = await GeoNumber.findOne({
    where: { code },
    include: [
      {
        model: GeoStreet,
        require: true,
        attributes: ['id', 'name', 'type', 'catalanType'],
        include: [
          {
            model: GeoCity,
            require: true,
            attributes: ['id', 'name'],
            include: [
              {
                model: GeoProvince,
                require: true,
                attributes: ['id', 'name'],
              },
            ],
          },
        ],
      },
    ],
  });

  assert(number, new errors.NotFound());

  return respondSuccess(number);
};

/**
 *
 * add a Geo-number record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postGeoNumber = async (body) => {
  const geo_number_with_same_code = await GeoNumber.findOne({
    where: { code: body.code },
  });

  if (geo_number_with_same_code)
    return respondBadRequest(`number with code ${body.code} exist`);

  const geo_street = await GeoStreet.findByPk(body.street_id);
  if (!geo_street)
    return respondNotFound(`street with id ${body.street_id} not exist`);

  const new_geo_number = await GeoNumber.create(body);
  return respondCreated(new_geo_number);
};

/**
 *
 * update a GeoNumber record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected GeoNumber (optional)
 * returns Object
 **/
exports.putGeoNumberId = async (id, body) => {
  return findAndUpdateNoInclude(id, body, GeoNumber);
};
