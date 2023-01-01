// @ts-check
'use strict';
const ErrorStackParser = require('error-stack-parser');
const models = require('@models');

const storeInDB = process.env.STORE_ERRORS_IN_DB === 'true';

/**
 * @param {Error} error
 * @param {{
 *   method?: string, // GET, POST, etc
 *   path?: string,
 *   body?: unknown,
 *   userId?: number,
 *   url?: string,
 *   query?: Record<string, unknown>,
 * }} param1
 */

exports.store = async (
  error,
  { method, path, body, userId, url, query } = {},
) => {
  console.error(error);

  if (!storeInDB) {
    return;
  }

  try {
    const Model = models?.system?.GlobalException;

    await Model.create({
      exception: {
        message: error?.message || JSON.stringify(error),
        stack: ErrorStackParser.parse(error),
      },
      request: {
        method,
        path,
        body,
        url,
        query,
      },
      userId,
    });
  } catch (e) {
    console.log('failing store exception', e);
  }
};

process.on('uncaughtException', (error) => exports.store(error));
// @ts-ignore
process.on('unhandledRejection', (error) => exports.store(error));
