'use strict';
const { ADDRESS } = require('@api/constants/address');
const { GfClient } = require('@api/models/intranet/intranet_gf_clients');
const {
  LemonAddressMapping,
} = require('@api/models/intranet/intranet_lemon_address_mapping');
const { pluck } = require('@api/utils/collections');
const Action = require('@lib/crud/Action');
const { lemon } = require('@lib/lemon');
const { Op } = require('sequelize');

const validateItemQuery = { [Op.and]: [{ [Op.not]: null }, { [Op.not]: '' }] };

const importRegions = async () => {
  /**@type {string[]} */
  const exists = pluck(
    await LemonAddressMapping.findAll({
      where: { type: ADDRESS.REGION },
      attributes: ['name'],
      raw: true,
    }),
    'name',
  );
  const lemonRegions = pluck(
    (await lemon.client.getRegions()).data,
    'id',
    'Comunidad_Autonoma',
  );
  const regions = await GfClient.findAll({
    where: { addressRegion: validateItemQuery },
    attributes: ['addressRegion', 'addressRegion'],
    group: ['addressRegion'],
  });

  await LemonAddressMapping.bulkCreate(
    regions
      .filter(({ addressRegion }) => !exists.includes(addressRegion))
      .map(({ addressRegion }) => {
        return {
          type: ADDRESS.REGION,
          name: addressRegion,
          code: null,
          lemon_id: lemonRegions[addressRegion] ?? null,
        };
      }),
  );
};

const importProvinces = async (regions) => {
  /**@type {string[]} */
  const exists = pluck(
    await LemonAddressMapping.findAll({
      where: { type: ADDRESS.PROVINCE },
      attributes: ['code'],
      raw: true,
    }),
    'code',
  );

  const lemonProvinces = pluck(
    await getLemonProvinces(regions),
    'id',
    'Provincia',
  );
  const provinces = await GfClient.findAll({
    where: {
      [Op.and]: [
        { addressProvinceCode: { [Op.not]: exists } },
        { addressProvince: validateItemQuery },
        { addressProvinceCode: validateItemQuery },
      ],
    },
    attributes: ['addressProvinceCode', 'addressProvince'],
    group: ['addressProvinceCode'],
  });

  await LemonAddressMapping.bulkCreate(
    provinces.map(({ addressProvinceCode, addressProvince }) => {
      return {
        type: ADDRESS.PROVINCE,
        name: addressProvince,
        code: addressProvinceCode,
        lemon_id: lemonProvinces[addressProvince] ?? null,
      };
    }),
  );
};
const getLemonProvinces = async (regions) => {
  const provinces = await Promise.all(
    regions.map((id) => lemon.client.getProvince(id)),
  );
  return provinces.map(({ data }) => data).flat();
};

const importCities = async (provinces) => {
  /**@type {string[]} */
  const exists = pluck(
    await LemonAddressMapping.findAll({
      where: { type: ADDRESS.CITY },
      attributes: ['code'],
      raw: true,
    }),
    'code',
  );

  const lemonCities = pluck(await getLemonCities(provinces), 'id', 'Poblacion');
  const cities = await GfClient.findAll({
    where: {
      [Op.and]: [
        { addressProvinceCode: { [Op.not]: exists } },
        { addressCity: validateItemQuery },
        { addressProvinceCode: validateItemQuery },
      ],
    },
    attributes: ['addressCityCode', 'addressCity'],
    group: ['addressCityCode'],
  });
  await LemonAddressMapping.bulkCreate(
    cities.map(({ addressCityCode, addressCity }) => {
      return {
        type: ADDRESS.CITY,
        name: addressCity,
        code: addressCityCode,
        lemon_id: lemonCities[addressCity] ?? null,
      };
    }),
  );
};
const getLemonCities = async (provinces) => {
  const cities = await Promise.all(
    provinces.map((id) => lemon.client.getCitiesOfProvince(id)),
  );
  return cities.map(({ data }) => data).flat();
};

module.exports = class ImportLemonAddresses extends Action {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {Object} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    // await LemonAddressMapping.destroy({ truncate: true });
    const exists = await LemonAddressMapping.findAll();
    await importRegions(
      exists
        .filter(({ type }) => type === ADDRESS.REGION)
        .map(({ name }) => name),
    );
    const regions = await LemonAddressMapping.findAll({
      where: { type: ADDRESS.REGION, lemon_id: { [Op.not]: null } },
      attributes: ['lemon_id'],
      raw: true,
    });

    if (regions.length === 0) return;

    await importProvinces(pluck(regions, 'lemon_id'), pluck(exists, 'code'));
    const provinces = await LemonAddressMapping.findAll({
      where: { type: ADDRESS.PROVINCE, lemon_id: { [Op.not]: null } },
      attributes: ['lemon_id'],
      raw: true,
    });

    if (provinces.length === 0) return;
    await importCities(pluck(provinces, 'lemon_id'), pluck(exists, 'code'));
  }
};
