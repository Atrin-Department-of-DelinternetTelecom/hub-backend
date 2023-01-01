// @ts-check
'use strict';

const { exec, ls } = require('@lib/shell');
const config = require('@config');
const moment = require('moment');
const {
  respondSuccess,
  respondInternalServerError,
  respondNotFound,
  respondBadRequest,
  respondOK,
} = require('@utils/response');
const to = require('await-to-js').default;
const {
  system: { Backup },
} = require('@models');

const { Op } = require('sequelize');

const fs = require('fs/promises');
const { createWriteStream, createReadStream } = require('fs');
const { default: axios } = require('axios');

/**
 * TODO: you can use stream/promises in nodejs +v16 to do this:
 * const { pipeline } = require('stream/promises');
 */

const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);
const knex = require('@lib/knex').intranet;
const { createAccessKey, verifyAccessKey, generateHmac } = require('./auth');
const urlSafeB64 = require('url-safe-base64');
const { getAllEntities, findAndGet } = require('@utils/request-handler');
const { dumpComplete, dumpCustom } = require('./dump');
const { errors } = require('@api/http/http_errors');

/**
 * @typedef {{ ok: boolean, message: string | null }} SystemStatus
 * @typedef {{ host: string, port: number, username: string, password: string }} Auth
 */

const auth = config.get('index.sequelize.intranet');

// Attention! Do not read this from configs. read from env variables instead
const ENABLE_BACKUP_RESTORE = process.env.ENABLE_BACKUP_RESTORE === 'true';

async function getAllBackups(query) {
  return getAllEntities(query, Backup);
}

async function getBackupId(id) {
  return findAndGet(id, Backup);
}

async function deleteBackupId(id) {
  const backup = await Backup.findByPk(id);
  if (!backup) {
    return respondNotFound('Backup not found');
  }

  await backup.destroy();
  await fs.unlink(`./backups/${backup.file_name}`);

  return respondSuccess();
}

/** @type {SystemStatus} */
let systemStatus = null;

/**
 * @returns {Promise<SystemStatus>}
 */
async function checkDependencies({ retry } = { retry: false }) {
  if (!retry && systemStatus) {
    return systemStatus;
  }

  const [dumpError] = await to(exec('mysqldump --version'));
  const [restoreError] = await to(exec('mysql --version'));
  const [gzipError] = await to(exec('gzip --version'));
  const [gunzipError] = await to(exec('gunzip --version'));

  const missing = [];
  if (dumpError) missing.push('mysqldump');
  if (restoreError) missing.push('mysql');
  if (gzipError) missing.push('gzip');
  if (gunzipError) missing.push('gunzip');

  const ok = !dumpError && !restoreError && !gzipError && !gunzipError;

  // make /uploads directory if it doesn't exist
  await fs.mkdir('./backups', { recursive: true });

  systemStatus = {
    ok,
    message: ok ? null : `${missing.join(', ')} not installed`,
  };

  return systemStatus;
}

async function triggerCompleteDump(ignoreTables) {
  const check = await checkDependencies();
  if (!check.ok) {
    return respondInternalServerError(check.message);
  }

  const id = moment().format('YYYYMMDDHHmmss');
  const fileName = `${id}-complete.sql.gz`;

  const backup = await Backup.create({
    type: 'complete',
    state: 'pending',
    error: null,
    file_name: fileName,
    creator_id: 1,
    size: 0,
  });

  // Do not wait for this to finish
  dumpComplete({ fileName, ignoreTables })
    .then(({ size }) =>
      backup.update({
        state: 'success',
        size,
      }),
    )
    .catch((e) =>
      backup.update({
        state: 'error',
        error: e.message,
      }),
    );

  return respondSuccess(backup);
}

/**
 *
 * @param {{ database: string, tables: string[] }} param0
 * @returns
 */
async function triggerCustomDump({ database, tables }) {
  const check = await checkDependencies();
  if (!check.ok) {
    return respondInternalServerError(check.message);
  }

  const id = moment().format('YYYYMMDDHHmmss');
  const fileName = `${id}-custom.sql.gz`;

  const backup = await Backup.create({
    type: 'custom',
    state: 'pending',
    error: null,
    file_name: fileName,
    creator_id: 1,
    size: 0,
  });

  // Do not wait for this to finish
  dumpCustom({ fileName, database, tables })
    .then(({ size }) =>
      backup.update({
        state: 'success',
        size,
      }),
    )
    .catch((e) =>
      backup.update({
        state: 'error',
        error: e.message,
      }),
    );

  return respondSuccess(backup);
}

/**
 *
 * @param {string} id
 * @param {string} database //TODO: you should keep the database backup entity
 * @returns
 */
async function restore(id, database = '') {
  if (!ENABLE_BACKUP_RESTORE) {
    return respondBadRequest('Backup restore is disabled');
  }

  const backup = await Backup.findByPk(id);

  if (!backup) {
    return respondNotFound(`Backup with id:${id} not found`);
  }

  const check = await checkDependencies();
  if (!check.ok) {
    return respondInternalServerError(check.message);
  }

  const file = `./backups/${backup.file_name}`;

  const { port, host, username, password } = auth;

  await exec(
    `gunzip < ${file} | mysql --host=${host} --port=${port} --user=${username} --password=${password} --protocol=TCP ${
      backup.type === 'custom' ? database : ''
    }`,
  );

  return respondSuccess(backup);
}

/**
 *
 * @param {{
 *  id: number
 *  host: string
 * }} param0
 */
async function getSecureDownloadLink({ id, host }) {
  const backup = await Backup.findByPk(id);

  if (!backup) {
    return respondNotFound(`Backup ${id} not found`);
  }

  const { accessKey } = createAccessKey(backup.id, host);

  const url = new URL(`${host}/api/v1/backups/download`);
  url.searchParams.append('key', urlSafeB64.encode(accessKey));

  return respondSuccess({
    url: url.toString(),
  });
}

/**
 *
 * @param {{ url: string }} param0
 * @returns
 */
async function importUrl({ url: _url }) {
  // download file and save it to ./backups
  const url = new URL(_url);
  const urlSafeKey = url.searchParams.get('key');
  const key = urlSafeB64.decode(urlSafeKey);

  console.log('given key', key);

  const hmac = generateHmac(key, url.origin);

  console.log(`generated hmac for given key and origin: ${url.origin}`, hmac);

  url.searchParams.set('hmac', urlSafeB64.encode(hmac));

  const id = moment().format('YYYYMMDDHHmmss');
  const fileName = `${id}-imported.sql.gz`;

  /** @type {import('axios').AxiosResponse<import('stream').Readable>} */
  const response = await axios.get(url.toString(), { responseType: 'stream' });

  if (response.headers['content-type'] !== 'application/gzip') {
    return respondBadRequest(
      `Invalid content type from server: ${response.headers['content-type']}. It's likely your key is invalid.`,
    );
  }

  const outFile = `./backups/${fileName}`;

  await pipeline(response.data, createWriteStream(outFile));
  const { size } = await fs.stat(outFile);

  const backup = await Backup.create({
    type: 'imported',
    file_name: fileName,
    state: 'success',
    error: null,
    creator_id: 1,
    size,
  });

  return respondSuccess(backup);
}

/**
 *
 * @param {{ key: string, hmac: string }} param0
 * @param {import('express').Response} response
 * @returns
 */
async function download({ key: _key, hmac: _hmac }, response) {
  const key = urlSafeB64.decode(_key);
  const hmac = urlSafeB64.decode(_hmac);

  const access = verifyAccessKey(key, hmac);

  if (!access) {
    throw new errors.Unauthorized('Invalid access key');
  }

  // download file and save it to ./backups

  const backup = await Backup.findByPk(access.backupId);

  if (!backup) {
    return respondNotFound(`Backup ${access.backupId} not found`);
  }

  const fileSrc = `./backups/${backup.file_name}`;

  const readStream = createReadStream(fileSrc);

  response.setHeader('Content-Type', 'application/gzip');
  response.setHeader(
    'Content-Disposition',
    `inline; filename="${backup.file_name}"`,
  );
  response.setHeader('Content-Length', backup.size);

  await pipeline(readStream, response);
}

async function getDatabases() {
  return ['delinternet_hub', 'intranet', 'moozaic'];
}

async function getDatabaseTables(database) {
  const [result, info] = await knex.raw(
    'SHOW TABLES FROM ?',
    knex.raw(database),
  );

  const columnName = info[0].name;

  return result.map((row) => row[columnName]);
}

async function sync() {
  const files = [...ls('./backups')];

  const result = await Backup.destroy({
    where: {
      file_name: {
        [Op.notIn]: files,
      },
    },
  });

  console.log(`Removed ${result} backups`);
  return respondOK(`Removed ${result} backups`);
}

module.exports = {
  checkDependencies,
  getAllBackups,
  getBackupId,
  deleteBackupId,
  triggerCompleteDump,
  triggerCustomDump,
  restore,
  getSecureDownloadLink,
  download,
  importUrl,
  getDatabases,
  getDatabaseTables,
  sync,
};
