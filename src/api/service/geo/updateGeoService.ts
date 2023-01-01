/* eslint-disable you-dont-need-lodash-underscore/get */

import {
  str_pad,
  titleCase,
  xml2json,
  baseUrl,
  qsBinder,
  objectMiner,
} from './lib/helper';

import _ from 'lodash';
import config from '@config';
import { system } from '@models';
import path from 'path';
import os from 'os';
import fs from 'fs';
import fsp from 'fs/promises';
import axios from 'axios';
import StreamZip from 'node-stream-zip';
import Proj4 from 'proj4';

import { Province, City, Street, Cadastre } from './types';

import { streetTypeList, parseCadastre } from './lib/cadastreParser';
import { Sequelize, Op } from 'sequelize';
import { respondNotFound, respondSuccess } from '@utils/response';

const { GeoProvince, GeoCity, GeoStreet, GeoNumber } = system;
const provinceRestrict = config.get('geo.restrict', 'tarragona').split(',');

/**
 * @param id country id  1 : spain
 * @param caller 0 : cron, 1 : restApi
 */
export const updateProvinces = async (id = 1, caller = 0) => {
  const provinces = await GeoProvince.findAll({
    where: {
      country_id: id,
    },
  });

  const response = await axios.get(baseUrl + config.get('geo.code.province'));
  const result: Province = await xml2json(response.data);
  const provs = result.consulta_provinciero.provinciero[0].prov;

  for (const {
    cpine: [cpine],
    np: [np],
  } of provs) {
    const hasProvince = (obj: any) => obj.code === 'P' + str_pad(cpine);

    const name = np.toUpperCase();

    if (
      provinces.some(hasProvince) ||
      (caller === 0 && !provinceRestrict.includes(name.toLowerCase()))
    )
      continue;

    const newProvince = {
      code: 'P' + str_pad(cpine),
      mhap_code: cpine,
      ine_code: cpine,
      name,
      formated_name: titleCase(np),
      country_id: 1, //spain
      import_cities: 0,
      auto_update: 0,
    };

    if (provinceRestrict.includes(name.toLowerCase()))
      newProvince.auto_update = 1;

    await GeoProvince.create(newProvince);
  }
};

export const updateCities = async (condition = {}) => {
  if (_.isEmpty(condition)) condition = { auto_update: 1 };

  const allProvinces = await GeoProvince.findAll({
    where: condition,
    include: [
      {
        model: GeoCity,
        attributes: ['code'],
      },
    ],
  });

  for (const province of allProvinces) {
    let newRecord = 0;

    const url = baseUrl + config.get('geo.code.city');
    const getUrl = qsBinder(url, [
      'CodigoProvincia=' + province.mhap_code,
      'CodigoMunicipio=',
      'CodigoMunicipioIne=',
    ]);

    const response = await axios.get(getUrl);
    const result: City = await xml2json(response.data);
    const munis = result.consulta_municipiero.municipiero[0].muni;
    for (const {
      nm: [nm],
      locat: [
        {
          cd: [cd],
          cmc: [cmc],
        },
      ],
      loine: [
        {
          cp: [cp],
          cm: [cm],
        },
      ],
    } of munis) {
      const hasCity = (obj: any) =>
        obj.code === 'C' + str_pad(province.mhap_code) + '.' + str_pad(cmc, 3);

      if (province.GeoCities.some(hasCity)) continue;

      const newCity = {
        name: nm.toUpperCase(),
        formated_name: nm.toUpperCase(),
        code: 'C' + str_pad(province.mhap_code) + '.' + str_pad(cmc, 3),
        mhap_province_code: cd,
        mhap_code: cmc,
        ine_province_code: cp,
        ine_code: cm,
        province_id: province.id,
        import_streets: 0,
        import_numbers: 0,
        auto_update: 0,
      };

      if (provinceRestrict.includes(province.name.toLowerCase()))
        newCity.auto_update = 1;

      await GeoCity.create(newCity);
      newRecord++;
    }

    await province.upgrade({
      import_cities: parseInt(province.import_cities) + newRecord,
      cities_imported_at: new Date(),
      auto_update: 1,
    });
  }
};

export const updateStreets = async (condition = {}) => {
  if (_.isEmpty(condition)) condition = { auto_update: 1 };

  const allCities = await GeoCity.findAll({
    where: condition,
    include: [
      {
        model: GeoProvince,
        attributes: ['name'],
      },
      {
        model: GeoStreet,
        attributes: ['code'],
      },
    ],
  });

  for (const city of allCities) {
    let newRecord = 0;

    const url = baseUrl + config.get('geo.code.street');
    const getUrl = qsBinder(url, [
      'CodigoProvincia=' + city.ine_province_code,
      'CodigoMunicipio=' + city.mhap_code,
      'CodigoMunicipioIne=' + city.ine_code,
      'CodigoVia=',
    ]);

    const response = await axios.get(getUrl);
    const result: Street = await xml2json(response.data);
    const calles = result.consulta_callejero.callejero[0].calle;
    for (const {
      loine: [
        {
          cp: [cp],
          cm: [cm],
        },
      ],
      dir: [
        {
          cv: [cv],
          tv: [tv],
          nv: [nv],
        },
      ],
    } of calles) {
      const hasStreet = (obj) =>
        obj.code ===
        'S' +
          str_pad(city.mhap_province_code) +
          '.' +
          str_pad(city.mhap_code, 3) +
          '.' +
          str_pad(cv, 5);

      if (city.GeoStreets.some(hasStreet) || typeof tv !== 'string') continue;

      const formated_type = _.get(streetTypeList[tv.toUpperCase()], [1], '');

      const newStreet = {
        ine_province_code: cp,
        ine_city_code: cm,
        mhap_city_code: city.mhap_code,
        dgc_code: cv,
        type: tv.toUpperCase(),
        formated_type,
        import_numbers: 0,
        name: nv,
        formated_name: titleCase(nv),
        city_id: city.id,
        code:
          'S' +
          str_pad(city.mhap_province_code) +
          '.' +
          str_pad(city.mhap_code, 3) +
          '.' +
          str_pad(cv, 5),
        auto_update: 0,
      };

      if (provinceRestrict.includes(city.GeoProvince.name.toLowerCase()))
        newStreet.auto_update = 1;

      await GeoStreet.create(newStreet);
      newRecord++;
    }

    await city.upgrade({
      import_streets: parseInt(city.import_streets) + newRecord,
      streets_imported_at: new Date(),
      auto_update: 1,
    });
  }
};

export const updateNumbers = async () => {
  const allCities = await GeoCity.findAll({
    where: {
      auto_update: 1,
    },
  });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'GeoNumbers')) + '/';

  for (const city of allCities) {
    const provinceAtom =
      config.get('geo.atom.ZipBase') +
      str_pad(city.ine_province_code) +
      '/ES.SDGC.ad.atom_' +
      str_pad(city.ine_province_code) +
      '.xml';

    const cityAtomXml = await axios.get(provinceAtom, {
      responseType: 'arraybuffer',
    });
    const cityAtomJson = await xml2json(cityAtomXml.data.toString('latin1'));

    const zipAtomXml = cityAtomJson.feed.entry.find((xmlList: any) => {
      return (
        xmlList.link[0].href[0].split('/').at(-1) ==
        `A.ES.SDGC.AD.${
          str_pad(city.ine_province_code) + str_pad(city.mhap_code, 3)
        }.zip`
      );
    }).link[0].href[0];

    const zipAtomFile = {
      url: encodeURI(zipAtomXml),
      zip: zipAtomXml.split('/').at(-1),
      gml: zipAtomXml.split('/').at(-1).replace('zip', 'gml'),
    };

    const zipAtomBuffer = await axios.get(
      zipAtomFile.url.replace('http', 'https'),
      {
        responseType: 'arraybuffer',
      },
    );

    await fsp.writeFile(
      path.join(tmpDir + zipAtomFile.zip),
      Buffer.from(zipAtomBuffer.data),
    );

    const zip = new StreamZip.async({
      file: path.join(tmpDir + zipAtomFile.zip),
    });
    const atomGmlBuf = await zip.entryData(zipAtomFile.gml);
    await zip.close();

    const gmlJson = await xml2json(atomGmlBuf);
    const allatomGeoNumber =
      gmlJson['gml:FeatureCollection']['gml:featureMember'];

    const streetByCode = await GeoStreet.findAll({
      where: {
        city_id: city.id,
      },
      attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('dgc_code')), 'dgc_code'],
        'id',
      ],
      // group: ['dgc_code'],
      include: [
        {
          model: GeoNumber,
          attributes: ['code'],
        },
      ],
    });

    const newAdded: Set<string> = new Set();
    const streetsWithCountNumber: {
      [index: string]: { count: number; street: object };
    } = {};

    for (const atomGeoNumber of allatomGeoNumber) {
      const codeHead =
        'N' +
        [str_pad(city.ine_province_code), str_pad(city.ine_code, 3)].join('.');

      const placeIdentify = objectMiner(atomGeoNumber, [
        'AD:Address',
        'AD:inspireId',
        'base:Identifier',
        'base:localId',
      ]).toString();
      if (!placeIdentify) continue;

      const streetCode = _.get(placeIdentify.split('.'), [2], '');
      const rcCode = placeIdentify.split('.').at(-1);

      const street = streetCode
        ? streetByCode.find((key) => {
            return key?.dgc_code === Number(streetCode);
          })
        : null;

      const geoLocator = objectMiner(atomGeoNumber, [
        'AD:Address',
        'AD:position',
        'AD:GeographicPosition',
        'AD:geometry',
        'gml:Point',
      ]);

      const [PosX, PosY] = objectMiner(geoLocator, ['gml:pos'])
        .toString()
        .split(' ');
      const geoProjection = 'EPSG:' + geoLocator.srsName[0].split('::').at(-1);

      Proj4.defs([
        ['EPSG:25828', '+proj=utm +zone=28 +ellps=GRS80 +units=m +no_defs'],
        ['EPSG:25829', '+proj=utm +zone=29 +ellps=GRS80 +units=m +no_defs'],
        ['EPSG:25830', '+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs'],
        ['EPSG:25831', '+proj=utm +zone=31 +ellps=GRS80 +units=m +no_defs'],
      ]);
      const [longitude, latitude] = Proj4(geoProjection, 'EPSG:4326', [
        parseFloat(PosX),
        parseFloat(PosY),
      ]);

      const number = objectMiner(atomGeoNumber, [
        'AD:Address',
        'AD:locator',
        'AD:AddressLocator',
        'AD:designator',
        'AD:LocatorDesignator',
        'AD:designator',
      ]);

      const postalStr = objectMiner(atomGeoNumber, [
        'AD:Address',
        'AD:component',
        'xlink:href',
      ]);

      const code = [
        codeHead,
        str_pad(street?.dgc_code, 5),
        str_pad(number, 5),
        rcCode,
      ].join('.');

      const hasNumber = (obj: any) => {
        return obj.code === code;
      };

      if (street?.GeoNumbers.some(hasNumber) || newAdded.has(code) || !street)
        continue;

      const newNumber = {
        gml_id: objectMiner(atomGeoNumber, ['AD:Address', 'gml:id']),
        rc: rcCode,
        gml_srs: geoProjection,
        gml_pos_x: PosX,
        gml_pos_y: PosY,
        gml_lat: latitude,
        gml_lng: longitude,
        postal_code: postalStr.split('.').at(-1),
        number,
        code,
        street_id: street.id,
      };
      if (!streetsWithCountNumber[street.id]) {
        streetsWithCountNumber[street.id] = { count: 0, street };
      }
      const number_of_current_street = streetsWithCountNumber[street.id].count;
      streetsWithCountNumber[street.id].count = number_of_current_street + 1;

      await GeoNumber.create(newNumber);
      newAdded.add(code);
    }
    updateNumberPropsPerStreet(streetsWithCountNumber);
    await city.upgrade({
      import_numbers: city.import_numbers + newAdded.size,
      numbers_imported_at: new Date(),
      auto_update: 1,
    });
  }

  updateRcMeta();
  fs.rmSync(tmpDir, { recursive: true });
};

/**
 * get list of street with props related to number columns, and update them
 * @param streetsWithCountNumber
 */
const updateNumberPropsPerStreet = (streetsWithCountNumber: {
  [index: string]: { count: number; street: object };
}) => {
  for (const streetId in streetsWithCountNumber) {
    const streetInfo = streetsWithCountNumber[streetId];
    const import_numbers =
      streetsWithCountNumber[streetId].count +
      (streetInfo.street.import_numbers ?? 0);
    streetInfo.street.update({
      import_numbers,
      numbers_imported_at: new Date(),
    });
  }
};

/**
 * update numbers of street
 * @param street_id id of street
 */
export const updateNumbersPerStreet = async (street_id = 1) => {
  const geo_street = await GeoStreet.findByPk(street_id, {
    include: [{ model: GeoCity }, { model: GeoNumber }],
  });

  if (!geo_street)
    return respondNotFound(`street with id ${street_id} not found`);

  const city = geo_street.GeoCity;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'GeoNumbers')) + '/';

  const provinceAtom =
    config.get('geo.atom.ZipBase') +
    str_pad(city.ine_province_code) +
    '/ES.SDGC.ad.atom_' +
    str_pad(city.ine_province_code) +
    '.xml';

  const cityAtomXml = await axios.get(provinceAtom, {
    responseType: 'arraybuffer',
  });
  const cityAtomJson = await xml2json(cityAtomXml.data.toString('latin1'));

  const zipAtomXml = cityAtomJson.feed.entry.find((xmlList: any) => {
    return (
      xmlList.link[0].href[0].split('/').at(-1) ==
      `A.ES.SDGC.AD.${
        str_pad(city.ine_province_code) + str_pad(city.mhap_code, 3)
      }.zip`
    );
  }).link[0].href[0];

  const zipAtomFile = {
    url: encodeURI(zipAtomXml),
    zip: zipAtomXml.split('/').at(-1),
    gml: zipAtomXml.split('/').at(-1).replace('zip', 'gml'),
  };

  const zipAtomBuffer = await axios.get(
    zipAtomFile.url.replace('http', 'https'),
    {
      responseType: 'arraybuffer',
    },
  );

  await fsp.writeFile(
    path.join(tmpDir + zipAtomFile.zip),
    Buffer.from(zipAtomBuffer.data),
  );

  const zip = new StreamZip.async({
    file: path.join(tmpDir + zipAtomFile.zip),
  });
  const atomGmlBuf = await zip.entryData(zipAtomFile.gml);
  await zip.close();

  const gmlJson = await xml2json(atomGmlBuf);
  const allatomGeoNumber =
    gmlJson['gml:FeatureCollection']['gml:featureMember'];

  const newAdded: Set<string> = new Set();

  for (const atomGeoNumber of allatomGeoNumber) {
    const codeHead =
      'N' +
      [str_pad(city.ine_province_code), str_pad(city.ine_code, 3)].join('.');

    const placeIdentify = objectMiner(atomGeoNumber, [
      'AD:Address',
      'AD:inspireId',
      'base:Identifier',
      'base:localId',
    ]).toString();
    if (!placeIdentify) continue;

    const streetCode = _.get(placeIdentify.split('.'), [2], '');
    const rcCode = placeIdentify.split('.').at(-1);

    if (geo_street.dgc_code !== Number(streetCode)) continue;

    const geoLocator = objectMiner(atomGeoNumber, [
      'AD:Address',
      'AD:position',
      'AD:GeographicPosition',
      'AD:geometry',
      'gml:Point',
    ]);

    const [PosX, PosY] = objectMiner(geoLocator, ['gml:pos'])
      .toString()
      .split(' ');
    const geoProjection = 'EPSG:' + geoLocator.srsName[0].split('::').at(-1);

    Proj4.defs([
      ['EPSG:25828', '+proj=utm +zone=28 +ellps=GRS80 +units=m +no_defs'],
      ['EPSG:25829', '+proj=utm +zone=29 +ellps=GRS80 +units=m +no_defs'],
      ['EPSG:25830', '+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs'],
      ['EPSG:25831', '+proj=utm +zone=31 +ellps=GRS80 +units=m +no_defs'],
    ]);
    const [longitude, latitude] = Proj4(geoProjection, 'EPSG:4326', [
      parseFloat(PosX),
      parseFloat(PosY),
    ]);

    const number = objectMiner(atomGeoNumber, [
      'AD:Address',
      'AD:locator',
      'AD:AddressLocator',
      'AD:designator',
      'AD:LocatorDesignator',
      'AD:designator',
    ]);

    const postalStr = objectMiner(atomGeoNumber, [
      'AD:Address',
      'AD:component',
      'xlink:href',
    ]);

    const code = [
      codeHead,
      str_pad(geo_street.dgc_code, 5),
      str_pad(number, 5),
      rcCode,
    ].join('.');

    const hasNumber = (obj: any) => {
      return obj.code === code;
    };
    if (
      geo_street.GeoNumbers.some(hasNumber) ||
      newAdded.has(code) ||
      !geo_street
    )
      continue;

    const newNumber = {
      gml_id: objectMiner(atomGeoNumber, ['AD:Address', 'gml:id']),
      rc: rcCode,
      gml_srs: geoProjection,
      gml_pos_x: PosX,
      gml_pos_y: PosY,
      gml_lat: latitude,
      gml_lng: longitude,
      postal_code: postalStr.split('.').at(-1),
      number,
      code,
      street_id: geo_street.id,
    };
    await GeoNumber.create(newNumber);
    newAdded.add(code);
  }

  await city.upgrade({
    import_numbers: city.import_numbers + newAdded.size,
    numbers_imported_at: new Date(),
    auto_update: 1,
  });

  await geo_street.update({
    import_numbers: geo_street.import_numbers + newAdded.size,
    numbers_imported_at: new Date(),
    auto_update: 1,
  });

  fs.rmSync(tmpDir, { recursive: true });
  return respondSuccess(`numbers in street with id ${street_id} updated`);
};

export const updateRcMeta = async (numberId = 0) => {
  let where: any = {
    where: {
      rc_meta: {
        [Op.or]: ['', null],
      },
    },
  };
  numberId !== 0 ? (where = { where: { id: numberId } }) : where;

  const limit = 300;
  const countedNumber = await GeoNumber.count({ col: 'id' });

  for (let offset = 0; offset <= countedNumber; offset + limit) {
    const allNumber = await GeoNumber.findAll({
      ...where,
      limit,
      offset,
      attributes: ['id', 'rc', 'rc_meta'],
      include: [
        {
          model: GeoStreet,
          attributes: [
            'id',
            'dgc_code',
            'mhap_city_code',
            'ine_city_code',
            'ine_province_code',
          ],
        },
      ],
    });

    if (!allNumber) return console.log('nothing needed to update rcMeta');

    for (const number of allNumber) {
      const cadastre = baseUrl + config.get('geo.code.cadastre');
      const CadastreUrl = qsBinder(cadastre, [
        'CodigoProvincia=' + number.GeoStreet.ine_province_code,
        'CodigoMunicipio=' + number.GeoStreet.mhap_city_code,
        'CodigoMunicipioINE=' + number.GeoStreet.ine_city_code,
        'CodigoVia=' + number.GeoStreet.dgc_code,
        'RC=' + number.rc,
      ]);

      const response = await axios.get(CadastreUrl);
      const result: Cadastre = await xml2json(response.data);
      const cadastreProperties = await parseCadastre(result);

      await number.upgrade({
        rc_meta: JSON.stringify(cadastreProperties),
        rc_meta_updated_at: new Date(),
      });
    }
  }
};
