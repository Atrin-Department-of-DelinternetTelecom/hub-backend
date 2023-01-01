/* eslint-disable you-dont-need-lodash-underscore/get */
'use strict';
const { Sequelize, Op } = require('sequelize');

const _ = require('lodash');

const {
  system: { GeoStreet, GeoCity, GeoProvince, GeoNumber },
} = require('@models');

const {
  getAllEntities,
  findAndUpdateNoInclude,
} = require('@utils/request-handler');

const { titleCase } = require('./lib/helper');

const {
  streetTypeList,
  hasText,
  getTypeOfName,
} = require('./lib/cadastreParser');

const {
  respondSuccess,
  respondNotFound,
  respondBadRequest,
  respondCreated,
} = require('@utils/response');

/**
 * Your GET endpoint
 * get all GeoStreets(information) record
 *
 * returns Object
 **/
exports.getGeoStreets = async (query) => {
  return getAllEntities(query, GeoStreet, undefined, [
    { model: GeoCity, as: 'GeoCity' },
  ]);
};

exports.getGeoStreetsByCityCode = async (cityCode, query) => {
  return getAllEntities(query, GeoStreet, undefined, [
    {
      model: GeoCity,
      as: 'GeoCity',
      required: true,
      where: { code: cityCode },
    },
  ]);
};

/**
 * Your GET endpoint
 * get single GeoStreet record by id
 *
 * id String
 * returns Object
 **/
exports.getGeoStreetId = async (id) => {
  const street = await GeoStreet.findByPk(id, {
    attributes: {
      include: [
        [
          Sequelize.literal(`(SELECT COUNT(id)
                    FROM ${GeoNumber.tableName}
                    WHERE street_id ="${Sequelize.col('id')}")`),
          'import_numbers',
        ],
      ],
    },
    include: [
      {
        model: GeoCity,
        attributes: ['id', 'name'],
        include: [
          {
            model: GeoProvince,
            attributes: ['id', 'name'],
          },
        ],
      },
    ],
  });

  if (!street) return respondNotFound(`street with id:${id} was not found`);
  else return respondSuccess(street);
};

exports.getGeoStreetByCode = async (code) => {
  const street = await GeoStreet.findOne({
    attributes: {
      include: [
        [
          Sequelize.literal(`(SELECT COUNT(id)
                    FROM ${GeoNumber.tableName}
                    WHERE street_id ="${Sequelize.col('id')}")`),
          'import_numbers',
        ],
      ],
    },
    where: { code },
    include: [
      {
        model: GeoCity,
        attributes: ['id', 'name'],
        include: [
          {
            model: GeoProvince,
            attributes: ['id', 'name'],
          },
        ],
      },
    ],
  });

  if (!street) return respondNotFound(`street with code:${code} was not found`);
  else return respondSuccess(street);
};

/**
 * Your HEAD endpoint
 * get street type & type name
 *
 **/
exports.getStreetTypesOfCity = async (query) => {
  const { id, filter, code } = query;

  if (code) {
    const city = await GeoCity.findOne({ where: { code } });
    return getAllEntities(query, GeoStreet, { city_id: city.id }, false, {
      attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('type')), 'type'],
        'formated_type',
      ],
    });
  } else if (id && parseInt(id) !== 0) {
    return getAllEntities(query, GeoStreet, { city_id: id }, false, {
      attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('type')), 'type'],
        'formated_type',
      ],
    });
  } else {
    const allTypes = [];
    const search = filter?.substring(
      filter.indexOf('%') + 1,
      filter.lastIndexOf('%'),
    );

    for (const type in streetTypeList) {
      const formated_type = streetTypeList[type][1];
      const catalan_type = streetTypeList[type][2];

      if (formated_type) {
        if (!search || hasText(search, formated_type)) {
          allTypes.push({
            type,
            formated_type,
            catalan_type,
          });
        }
      }
    }
    // if (!search && (offset || limit)) allTypes = allTypes.slice(offset, limit);
    return respondSuccess(allTypes);
  }
};

/**
 *
 * add a Geo-street record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postGeoStreets = async (body) => {
  const street_with_same_code = await GeoStreet.findOne({
    where: { code: body.code },
  });

  if (street_with_same_code)
    return respondBadRequest(`street with code ${body.code} exist`);

  const geo_city = await GeoCity.findByPk(body.city_id);
  if (!geo_city)
    return respondNotFound(`city with id ${body.city_id} not found`);

  const new_geo_street = await GeoStreet.create(body);
  return respondCreated(new_geo_street);
};

/**
 *
 * update a GeoStreet record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected GeoStreet (optional)
 * returns Object
 **/
exports.putGeoStreetId = async (id, body) => {
  const street_with_same_code = await GeoStreet.findOne({
    where: { code: body.code },
  });

  if (street_with_same_code)
    return respondBadRequest(`street with code ${body.code} exist`);

  const geo_city = await GeoCity.findByPk(body.city_id);
  if (!geo_city)
    return respondNotFound(`city with id ${body.city_id} not found`);

  return findAndUpdateNoInclude(id, body, GeoStreet);
};

exports.addressToGeoObject = async (address) => {
  const [streetInfo, cityInfo, provinceName] = address;

  const [streetPrefix, streetNameWithCode] = prefixSplinter(streetInfo);
  const [postalCode, cityName] = prefixSplinter(cityInfo);

  let streetName = streetNameWithCode;
  const arrayStreetInfo = streetNameWithCode.split(' ');
  if (!isNaN(Number(arrayStreetInfo.slice(-1)))) {
    arrayStreetInfo.pop();
    streetName = arrayStreetInfo.join(' ');
  }

  const [type, formated_type] =
    streetPrefix.length > 2
      ? [getTypeOfName(streetPrefix), titleCase(streetPrefix)]
      : [
          streetPrefix.toUpperCase(),
          titleCase(_.get(streetTypeList[streetPrefix.toUpperCase()], [1], '')),
        ];

  return GeoProvince.findOne({
    where: {
      name: {
        [Op.like]: provinceName,
      },
    },
    include: [
      {
        model: GeoCity,
        required: false,
        where: {
          name: {
            [Op.like]: cityName,
          },
        },
        include: [
          {
            model: GeoStreet,
            required: false,
            limit: 10,
            where: {
              type,
              name: {
                [Op.like]: streetName,
              },
            },
            include: [
              {
                model: GeoNumber,
                required: false,
                limit: 5,
                where: {
                  postal_code: postalCode,
                },
              },
            ],
          },
        ],
      },
    ],
  });
};

const prefixSplinter = (fullName) => {
  const result = [
    fullName.split(' ').at(0).trim(),
    fullName.split(' ').slice(1).join(' ').trim(),
  ];
  return result;
};
