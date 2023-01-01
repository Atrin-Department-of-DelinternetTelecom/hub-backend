// @ts-check
'use strict';

const crypto = require('crypto');
const config = require('@config');

const secret = config.get('global.backup.secret');
console.log('backup secret is', secret);

/**
 * @typedef {{
 *   backupId: number,
 *   accessKey: string,
 *   hmac: string,
 *   origin: string,
 *   expireAt: Date,
 * }} Access
 */

/**
 * @type {Map<string, Access>} key is accessKey
 */
const accessKeys = new Map();

const TEN_MINUTES = 10 * 60 * 1000;

/**
 * @param {string} accessKey
 * @param {string} origin
 * @returns
 */
function generateHmac(accessKey, origin) {
  return crypto
    .createHmac('sha256', secret)
    .update(origin + accessKey)
    .digest('base64');
}

/**
 * @param {number} backupId
 * @param {string} origin
 */
function createAccessKey(backupId, origin) {
  console.log('creating new access key for', {
    backupId,
    origin,
  });
  const accessKey = crypto.randomBytes(16).toString('base64');

  const key = {
    backupId,
    accessKey,
    origin,
    hmac: generateHmac(accessKey, origin),
    expireAt: new Date(Date.now() + TEN_MINUTES),
  };

  accessKeys.set(accessKey, key);
  return key;
}

/**
 *
 * @param {string} accessKey
 * @param {string} hmac
 * @returns { false | Access }
 */
function verifyAccessKey(accessKey, hmac) {
  const key = accessKeys.get(accessKey);
  if (!key) {
    console.warn(`key ${accessKey} not found in in-memory keys`);
    return false;
  }

  if (Date.now() > key.expireAt.getTime()) {
    console.warn(`key ${accessKey} is expired`);
    accessKeys.delete(accessKey);
    return false;
  }

  const expectedHmac = generateHmac(accessKey, key.origin);

  if (hmac !== expectedHmac) {
    console.warn(
      `expectedHmac ${expectedHmac} is not equal to givenHmac ${hmac}. key.origin is ${key.origin} `,
    );
    return false;
  }

  console.log('key is valid');
  // accessKeys.delete(accessKey);
  return key;
}

module.exports = {
  createAccessKey,
  verifyAccessKey,
  generateHmac,
};
