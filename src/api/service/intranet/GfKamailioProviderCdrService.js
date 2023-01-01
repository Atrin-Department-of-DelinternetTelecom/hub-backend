'use strict';

const {
  intranet: { GfKamailioProviderCdr, GfKamailioProvider, GfKamailioUnifiedCdr },
  AnyModel,
} = require('@models');

const config = require('@config');

const fixProviderCdr = config.get('index.minIoBuckets.fix-provider-cdr');

const fixProviderBucketName = new URL(fixProviderCdr).pathname.replace('/', '');

const { errors: responseError } = require('@api/http/http_errors');
const uuid = require('uuid');

const {
  getAllEntities,
  findAndGet,
  findAndUpdate,
} = require('@utils/request-handler');

const {
  respondCreated,
  respondSuccess,
  respondBadRequest,
} = require('@utils/response');

const { getBucket } = require('@lib/minIO');

const { Static } = require('@lib/cache');

const crypto = require('crypto');

const moment = require('moment');

const actionRunner = require('@lib/action-runner').default;

const JSZip = require('jszip');

const { parseSingleCall } = require('./FixCDR_GfTmpKamailioInvoiceService');

const CounterService = require('../../service/global/CounterService');

const _ = require('lodash');

const { default: to } = require('await-to-js');

const path = require('path');

const { bufferFromReadable } = require('@lib/s3');
const { operadorFixFacadeInstance } = require('./OperadorFixFacade');

const archiver = require('archiver');
const { WritableStreamBuffer } = require('stream-buffers');
const { Readable } = require('stream');

/**
 *
 * delete a Gf Kamailio Provider Cdr record by id
 *
 * id String
 * returns Object
 **/
exports.deleteGfKamailioProviderCdrsId = async function (id) {
  const gfKamailioProviderCdr = await GfKamailioProviderCdr.findByPk(id);
  if (!gfKamailioProviderCdr) {
    throw new responseError.NotFound(
      `GfKamailioProviderCdr with id ${id} not found`,
    );
  }

  gfKamailioProviderCdr.status = 0;
  await gfKamailioProviderCdr.save();

  //delete old data (hard delete)
  await GfKamailioUnifiedCdr.destroy({
    where: {
      providerCdrId: id,
    },
  });

  return respondSuccess(
    `GfKamailioProviderCdr with id ${id} deleted successfuly`,
  );
};

/**
 * Your GET endpoint
 * get all  Gf Kamailio Provider Cdrs record
 *
 * returns Object
 **/
exports.getGfKamailioProviderCdrs = async function (query) {
  return getAllEntities(query, GfKamailioProviderCdr);
};

/**
 * Your GET endpoint
 * get single Gf Kamailio Provider Cdr record by id
 *
 * id String
 * returns Object
 **/
exports.getGfKamailioProviderCdrsId = async function (id) {
  return findAndGet(id, GfKamailioProviderCdr);
};

/**
 * Your Post endpoint
 * get and create Provider Cdrs record from operadors
 *
 * returns Object
 **/
exports.createGfKamailioProviderCdrFromOperadors = async function (body) {
  try {
    const cdrFileName = body.hubFile
      ? path.basename(body.hubFile, path.extname(body.hubFile))
      : `${uuid.v4()}`;
    const minioClient = await getBucket(fixProviderCdr);

    const yearMonth = moment({
      year: body.year,
      month: body.month - 1,
      day: 1,
    }).subtract(1, 'months');
    const result = await operadorFixFacadeInstance.getCdr(
      yearMonth.format('YYYY'),
      yearMonth.format('MM'),
    );
    const csvStream = Readable.from([result.data]);
    const zipBuffer = new WritableStreamBuffer();
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });
    archive.pipe(zipBuffer);
    archive.append(csvStream, { name: `${cdrFileName}.csv` });
    await archive.finalize();
    const zipFileName = `${cdrFileName}.zip`;
    await minioClient.putObject(
      fixProviderBucketName,
      zipFileName,
      zipBuffer.getContents(),
    );
    return respondSuccess({ filename: zipFileName });
  } catch (error) {
    return respondBadRequest(error.message);
  }
};
/**
 *
 * save  Gf Kamailio Provider Cdr
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postGfKamailioProviderCdrs = async function (body) {
  const { providerId, hubFile } = body;
  const ext = path.extname(hubFile);
  if (ext.toLowerCase() !== '.zip')
    throw new responseError.BadRequest(`invalid format file`);
  const provider = await GfKamailioProvider.findByPk(providerId);

  if (!provider)
    throw new responseError.NotFound(
      `provider with id ${providerId} not found`,
    );

  const minioClient = await getBucket(fixProviderCdr);
  const [error] = await to(
    minioClient.getObject(fixProviderBucketName, hubFile),
  );
  if (error) throw new responseError.NotFound(`file not found`);

  const gfKamailioProviderCdr = await GfKamailioProviderCdr.create(body);

  return respondCreated(gfKamailioProviderCdr);
};

/**
 *
 * update a   Gf Kamailio Provider Cdr record by id
 *
 * id String
 * returns Object
 **/
exports.putGfKamailioProviderCdrsId = async function (id, body) {
  const { providerId, hubFile } = body;
  if (hubFile && path.extname(hubFile).toLowerCase() !== '.zip') {
    throw new responseError.BadRequest(`invalid format file`);
  }
  const provider = await GfKamailioProvider.findByPk(body.providerId);
  if (!provider)
    throw new responseError.NotFound(
      `provider with id ${providerId} not found`,
    );
  const minioClient = await getBucket(fixProviderCdr);
  const [error] = await to(
    minioClient.getObject(fixProviderBucketName, hubFile),
  );
  if (hubFile & error) throw new responseError.NotFound(`file not found`);

  return findAndUpdate(id, body, GfKamailioProviderCdr);
};

/**
 *
 * parse data related to Gf Kamailio Provider Cdr record by id
 *
 * id String
 * returns Object
 **/
exports.parseGfKamailioProviderCdrsId = async function (id, creator_id) {
  //validate id of GfKamailioProviderCdr
  const gfKamailioProviderCdr = await GfKamailioProviderCdr.findByPk(id, {
    include: {
      model: GfKamailioProvider,
      as: 'provider',
    },
  });
  if (!gfKamailioProviderCdr) {
    throw new responseError.NotFound(
      `GfKamailioProviderCdr with id ${id} not found`,
    );
  }

  //extract data and convert to array of object from file related to gfKamailioProviderCdr record and put data in redis
  const keys = await putCsvRowsInRedis(gfKamailioProviderCdr);

  //delete old data (hard delete)
  await GfKamailioUnifiedCdr.destroy({
    where: {
      providerCdrId: id,
    },
  });

  await CounterService.create(`GfKamailioProvidersCdr_${id}`, {
    max: keys.length,
  });

  //add task as worker to parse data
  const actions = keys.map((key) => {
    return {
      name: 'parse-fix-cdr',
      params: {
        fixCdrStatusId: gfKamailioProviderCdr.id,
        memoryKey: key,
      },
    };
  });

  await actionRunner.createBulk(
    {
      creator_id: creator_id,
      name: 'parse-fix-cdr',
      model_name: 'gf_kamailio_providers_cdr',
      model_id: gfKamailioProviderCdr.id,
      params: {
        fetchActions: 1,
      },
    },
    actions,
  );

  return respondSuccess(`start import cdr`);
};

/**
 * extract csv file and normailze data inside csv file then put group of arrays in redis
 * @param {AnyModel} gfKamailioProviderCdr kamailio cdr provider included with provider
 * @returns {Promise<string[] | object>} if process is ok, return array of keys to access from redis else return respond object
 */
const putCsvRowsInRedis = async (gfKamailioProviderCdr) => {
  const [error, csvString] = await to(
    extractCsvFileFromZip(gfKamailioProviderCdr.hubFile),
  );
  if (error)
    throw new responseError.BadRequest(`enable parse data form csv file`);

  const keys = convertCsvToJSONAndPutInRedis(
    csvString,
    gfKamailioProviderCdr.provider.providerCode,
  );
  return keys;
};

/**
 * get address of intranet server and use ftp to fetch zip file then extract the file and convert it to string
 * @param {string} filename related filename of cdr provider
 * @returns {Promise<string>}
 */
const extractCsvFileFromZip = async (filename) => {
  const zip = new JSZip();
  const minioClient = await getBucket(fixProviderCdr);

  const [err, stat] = await to(
    minioClient.statObject(fixProviderBucketName, filename),
  );

  const [getObjectError, readable] = await to(
    minioClient.getObject(fixProviderBucketName, filename),
  );
  if (err || getObjectError) throw new Error(`could not get provider cdr file`);

  const data = await bufferFromReadable(stat.size, readable);
  const zip_files = await zip.loadAsync(data);
  if (!zip_files.files && Object.keys(zip_files.files).length > 1)
    throw new Error('invalid zip file');

  const fileName = zip_files.files[Object.keys(zip_files.files)[0]];
  const file = zip_files.file(fileName.name);
  return (await file.async('nodebuffer')).toString('utf-8');
};

/**
 * parse rows based on provider(gfKamailioProviderCdr) and insert to database
 * @param {number} gfKamailioProviderCdrId gf kamailio provider cdr id
 * @param {Array} rows list of rows should insert to database as GfKamailioUnifiedCdr
 * @param {string} pass number of queue included this rows
 */
exports.parse = async (gfKamailioProviderCdrId, rows, pass) => {
  /**
   * @typedef {(gfKamailioProviderCdr: object, rows: any[]) => Promise<void>} Parser
   * @type {Record<string, Parser>}
   */
  const parsers = {
    tucall: tucallParser,
    aire: aireParser,
    del: delParser,
    iron: ironParser,
  };

  const gfKamailioProviderCdr = await GfKamailioProviderCdr.findByPk(
    gfKamailioProviderCdrId,
    {
      include: {
        model: GfKamailioProvider,
        as: 'provider',
      },
    },
  );

  const parser = parsers[gfKamailioProviderCdr.provider.providerCode];
  if (!parser) {
    throw new Error(
      `no code to parse this provider ${gfKamailioProviderCdr.provider.providerCode}`,
    );
  }

  await parser(gfKamailioProviderCdr, rows, pass);
};

/**
 * normalize data and insert to database with method tucaclll
 * @param {object} gfKamailioProviderCdr information about cdr provider
 * @param {any[]} rows list of data from csv
 * @param {string} pass number of queue included this rows
 */
const tucallParser = async (gfKamailioProviderCdr, rows, pass) => {
  const unifiedCdrPromise = [];
  for (const row of rows) {
    if (!row.date) {
      continue;
    }
    const date = moment(row.date);
    if (!date.isValid()) {
      throw new Error('error parsing date');
    }

    const recRow = {
      providerCdrId: gfKamailioProviderCdr.id,
      date: date.format('YYYY-MM-DD HH:mm:ss'),
      from: row.from,
      to: row.to,
      seconds: row.seconds,
      cost: row.cost.replace(',', '.'),
      pass,
    };
    unifiedCdrPromise.push(parseSingleCall(recRow));
  }
  const unifiedCdrs = await Promise.all(unifiedCdrPromise);
  await GfKamailioUnifiedCdr.bulkCreate(unifiedCdrs);
};

/**
 * normalize data and insert to database with method aire
 * @param {object} gfKamailioProviderCdr information about cdr provider
 * @param {any[]} rows list of data from csv
 * @param {string} pass number of queue included this rows
 */
const aireParser = async (gfKamailioProviderCdr, rows, pass) => {
  const unifiedCdrPromise = [];
  for (const row of rows) {
    if (!row.id) {
      continue;
    }
    const _date = row.date.split(' ');
    const __date = _date[0].split('/');
    const ___date = `20${__date[2]}-${__date[1]}-${__date[0]} ${_date[1]}`;
    if (!moment(___date).isValid()) {
      throw new Error('error parsing date');
    }

    const recRow = {
      providerCdrId: gfKamailioProviderCdr.id,
      date: ___date,
      from: row.from.replace('->', ''),
      to: row.to,
      seconds: row.seconds,
      cost: row.cost.replace(',', '.'),
      pass,
    };
    unifiedCdrPromise.push(parseSingleCall(recRow));
  }
  const unifiedCdrs = await Promise.all(unifiedCdrPromise);
  await GfKamailioUnifiedCdr.bulkCreate(unifiedCdrs);
};

/**
 * normalize data and insert to database with method del
 * @param {object} gfKamailioProviderCdr information about cdr provider
 * @param {any[]} rows list of data from csv
 * @param {string} pass number of queue included this rows
 */
const delParser = async (gfKamailioProviderCdr, rows, pass) => {
  const unifiedCdrPromise = [];
  for (const row of rows) {
    if (!row.date) {
      continue;
    }
    const date = moment(row.date);
    if (!date.isValid()) {
      throw new Error('error parsing date');
    }

    //duration
    const parts = row.duration.split(':');
    const seconds =
      parseInt(parts[2]) + parseInt(parts[1]) * 60 + parseInt(parts[0]) * 3600;
    const recRow = {
      providerCdrId: gfKamailioProviderCdr.id,
      date: date.format('YYYY-MM-DD HH:mm:ss'),
      from: row.Source,
      to: row.Destination,
      seconds,
      cost: row.Cost,
      pass,
    };
    unifiedCdrPromise.push(parseSingleCall(recRow));
  }
  const unifiedCdrs = await Promise.all(unifiedCdrPromise);
  await GfKamailioUnifiedCdr.bulkCreate(unifiedCdrs);
};

/**
 * normalize data and insert to database with method iron
 * @param {object} gfKamailioProviderCdr information about cdr provider
 * @param {any[]} rows list of data from csv
 * @param {string} pass number of queue included this rows
 */
const ironParser = async (gfKamailioProviderCdr, rows, pass) => {
  const unifiedCdrPromise = [];
  for (const row of rows) {
    if (!row.callid) {
      continue;
    }

    const recRow = {
      providerCdrId: gfKamailioProviderCdr.id,
      date: row.startTime.replace('"', '').replace('"', ''),
      from: row.caller.replace('+', '00'),
      to: row.callee.replace('+', '00'),
      seconds: row.duration,
      cost: row.price.replace(',', '.') || 0,
      pass,
    };
    unifiedCdrPromise.push(parseSingleCall(recRow));
  }
  const unifiedCdrs = await Promise.all(unifiedCdrPromise);
  await GfKamailioUnifiedCdr.bulkCreate(unifiedCdrs);
};

/**
 * convert string csv to list of object and put group of objects in redis
 * @param {string} csv stringfyed csv file
 * @returns {string[]} list of key to access from redis
 */
const convertCsvToJSONAndPutInRedis = (csv, parser) => {
  const { separator, replace } = getRolesBasedOnParser(parser);
  if (replace) {
    csv.replace(/"/g, '');
  }
  const [headerLine, ...bodyLines] = csv.split('\n');
  const result = [];
  const headers = headerLine.split(separator);

  for (const line of bodyLines) {
    const obj = {};
    const currentLine = line.split(',');

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentLine[j];
    }
    result.push(obj);
  }

  const keyPrefix = crypto.randomBytes(8).toString('hex');
  let i = 0;
  const keys = [];

  for (const chunk of _.chunk(result, 2000)) {
    const key = `${keyPrefix}_${i}`;
    i++;
    Static.remember(key, JSON.stringify(chunk), 3600); // one hour TTL
    keys.push(key);
  }

  return keys;
};

/**
 * get type of seprator and replacement base on parser
 * @param {string} parser parser method to select code
 * @returns {{ separator: string, replace: string | null }} contain seprator and replase
 */
const getRolesBasedOnParser = (parser) => {
  let separator = null;
  let replace = null;
  switch (parser) {
    case 'aire':
      separator = ';';
      break;
    case 'tucall':
      separator = ';';
      break;
    case 'del':
      separator = ',';
      replace = '"';
      break;
    case 'iron':
      separator = ',';
      break;
  }
  return {
    separator,
    replace,
  };
};
