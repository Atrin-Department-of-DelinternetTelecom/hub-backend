'use strict';

/**
 * Just import/require this module to register env files
 * We should keep it in JavaScript, because it also used by migration scripts
 * and we don't want to use swc to migrations for now
 */

const { config } = require('dotenv');
const { join } = require('path');

const env = process.env.NODE_ENV ?? 'development';
const fileName = `.env.${env.toLowerCase()}`;

config({
  path: join(process.cwd(), fileName),
});
