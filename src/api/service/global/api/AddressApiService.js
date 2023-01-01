'use strict';

const config = require('@config');
const axios = require('axios').default;
const { respondSuccess } = require('@utils/response');
const _ = require('lodash');

const AddressApi = config.get('index.AddressApi');
const formattedAddressApi = config.get('index.formattedAddressApi');

const {
  system: { GeoProvince, GeoCity },
} = require('@models');

const to = require('await-to-js').default;

const getProvinces = async (query = null) => {
  const res = await search('provinces', {}, query);
  return respondSuccess(res.data.data);
};

const getCities = async (province, query) => {
  try {
    const res = await search(
      'cities',
      {
        province,
      },
      query,
    );
    res.data.data.push({
      alias: '',
      code: 'UNK',
      formated_name: 'No se la població',
      id: 0,
      value: 'No se la població',
    });
    return respondSuccess(res.data.data);
  } catch (error) {
    return respondSuccess([
      {
        alias: '',
        code: 'UNK',
        formated_name: 'No se la població',
        id: 0,
        value: 'No se la població',
      },
    ]);
  }
};

const getPostalCodes = async (city, query) => {
  try {
    const res = await search(
      'postalcodes',
      {
        city,
      },
      query,
    );
    res.data.data.push({
      postalCode: 'No el se',
      total: 'No se el codi postal',
      value: 'No se el codi postal',
    });
    return respondSuccess(res.data.data);
  } catch (error) {
    return respondSuccess([
      {
        postalCode: 'No el se',
        total: 'No se el codi postal',
        value: 'No se el codi postal',
      },
    ]);
  }
};

const getStreetTypes = async (city, query) => {
  try {
    const res = await search(
      'types',
      {
        city,
      },
      query,
    );

    return respondSuccess(res.data.data);
  } catch (error) {
    return respondSuccess([]);
  }
};

const getStreets = async (city, rueTypeCode = '', query) => {
  try {
    _.set(
      query,
      'search.whereQuery.name',
      _.get(query, 'search.whereQuery.value', ''),
    );
    const res = await search(
      'streets',
      {
        city,
      },
      query,
    );
    const response = res.data.data.map((item) =>
      rueTypeCode === '' || item.type === rueTypeCode
        ? {
            ...item,
            value: item.formated_type + ' ' + item.formated_name,
          }
        : item,
    );

    response.push({
      id: 0,
      code: 'UNK',
      formated_name: 'No se el carrer',
      alias: '',
      value: 'No se el carrer',
    });

    response.push({
      id: 0,
      code: 'NTCDT',
      formated_name: 'No puc trobar el carrer',
      alias: '',
      value: 'No puc trobar el carrer',
    });

    return respondSuccess(response);
  } catch (error) {
    return respondSuccess([
      {
        id: 0,
        code: 'UNK',
        formated_name: 'No se el carrer',
        alias: '',
        value: 'No se el carrer',
      },
      {
        id: 0,
        code: 'NTCDT',
        formated_name: 'No puc trobar el carrer',
        alias: '',
        value: 'No puc trobar el carrer',
      },
    ]);
  }
};

const getNumbers = async (street, query) => {
  try {
    const res = await search(
      'numbers',
      {
        street,
      },
      query,
    );
    const response = res.data.data.map((item) => ({
      ...item,
      value: item.number + (item.alias !== '' ? `(${item.alias})` : ''),
      lat: item.geo.lat,
      lng: item.geo.lng,
    }));
    return respondSuccess(response);
  } catch (error) {
    return respondSuccess([]);
  }
};

const getBuildings = async (number = '') => {
  const numberObject = await getNumberApi(number);
  if (Object.keys(numberObject).length === 0) {
    return respondSuccess({});
  }
  const response = numberObject.blocks.forEach((block) => {
    return {
      value: block,
      code: number + '!' + block,
    };
  });
  return respondSuccess(response);
};

const getStairways = async (buildingCode = '') => {
  const parts = buildingCode.split('!');
  const number = parts[0];
  const buildingNode = parts[1];
  const numberObject = await getNumberApi(number);
  if (Object.keys(numberObject).length === 0) {
    return respondSuccess({});
  }
  const stairways = numberObject.blocks[buildingNode].stairways;
  const response = stairways.forEach((stairway) => {
    return {
      value: stairway,
      code: buildingCode + '!' + stairway,
    };
  });
  return respondSuccess(response);
};

const getFloors = async (stairwayCode = '') => {
  const parts = stairwayCode.split('!');
  const number = parts[0];
  const buildingNode = parts[1];
  const stairwayNode = parts[2];
  const numberObject = await getNumberApi(number);
  if (Object.keys(numberObject).length === 0) {
    return respondSuccess({});
  }
  const floors =
    numberObject.blocks[buildingNode].stairways[stairwayNode].floors;
  const response = floors.forEach((floor) => {
    return {
      value: floor,
      code: stairwayCode + '!' + floor,
    };
  });
  return respondSuccess(response);
};

const getDoors = async (floorCode = '') => {
  const parts = floorCode.split('!');
  const number = parts[0];
  const buildingNode = parts[1];
  const stairwayNode = parts[2];
  const floorNode = parts[3];
  const numberObject = await getNumberApi(number);
  if (Object.keys(numberObject).length === 0) {
    return respondSuccess({});
  }
  const doors =
    numberObject.blocks[buildingNode].stairways[stairwayNode].floors[floorNode]
      .doors;
  const response = doors.forEach((door) => {
    return {
      value: door,
      code: floorCode + '!' + door,
    };
  });
  return respondSuccess(response);
};

const getQuery = (query) => {
  let q = undefined;
  if (_.get(query, 'search.whereQuery.name', false)) {
    q = query.search.whereQuery.name;
  }
  return q;
};

const search = async (where, param, query) => {
  return await axios.get(`${AddressApi}${where}`, {
    params: {
      ...param,
      q: getQuery(query),
    },
  });
};

const getNumberApi = async (number) => {
  const res = await axios.get(`${AddressApi}numbers/${number}`);
  return res.data.data.rc_meta.length === 0
    ? {}
    : res.data.data.rc_meta.properties;
};

const getFormatedAddress = async (lat, lng) => {
  const url = `${formattedAddressApi.url}/reverse?format=json&lat=${lat}&lon=${lng}`;
  const address = (await axios.get(url)).data;
  return respondSuccess({
    formatted_address: address.display_name,
    address: address.address,
  });
};

const syncWithGoufone = async () => {
  const localProvinceCodes = (await GeoProvince.findAll()).map(
    (province) => province.code,
  );

  let newProvinces = ((await search('provinces', {}, {}))?.data?.data ?? [])
    .filter((province) => !localProvinceCodes.includes(province.code))
    .map(({ code, formated_name }) => ({
      code,
      formated_name,
      name: formated_name.toUpperCase(),
      country_id: 1,
      mhap_code: parseInt(code.replace(/[^0-9]/g, '')),
      ine_code: parseInt(code.replace(/[^0-9]/g, '')),
    }));

  //bulk create should return id of created data
  newProvinces = newProvinces.length
    ? await GeoProvince.bulkCreate(newProvinces, { returning: true })
    : [];

  const newCitiesOfProvinces = [];
  for (const newProvince of newProvinces) {
    const [error, cities] = await to(
      search(
        'cities',
        {
          province: newProvince.code,
        },
        {},
      ),
    );

    if (!error && cities?.data?.data.length) {
      newCitiesOfProvinces.push(
        ...cities.data.data.map(({ alias, code, formated_name }) => ({
          formated_name,
          name: formated_name,
          code,
          mhap_code: parseInt(code.split('.')[1]?.replace(/[^0-9]/g, '')),
          ine_code: parseInt(code.split('.')[1]?.replace(/[^0-9]/g, '')),
          mhap_province_code: parseInt(
            code.split('.')[0]?.replace(/[^0-9]/g, ''),
          ),
          ine_province_code: parseInt(
            code.split('.')[0]?.replace(/[^0-9]/g, ''),
          ),
          alias,
          province_id: newProvince.id,
        })),
      );
    }
  }

  newCitiesOfProvinces.length
    ? await GeoCity.bulkCreate(newCitiesOfProvinces)
    : null;

  return respondSuccess('sync done.');
};

module.exports.getProvinces = getProvinces;
module.exports.getCities = getCities;
module.exports.getPostalCodes = getPostalCodes;
module.exports.getStreetTypes = getStreetTypes;
module.exports.getStreets = getStreets;
module.exports.getBuildings = getBuildings;
module.exports.getNumbers = getNumbers;
module.exports.getStairways = getStairways;
module.exports.getFloors = getFloors;
module.exports.getDoors = getDoors;
module.exports.getFormatedAddress = getFormatedAddress;
module.exports.syncWithGoufone = syncWithGoufone;
