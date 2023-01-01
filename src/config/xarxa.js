'use strict';

module.exports = {
  base: process.env.XARXA_URL ?? 'http://localhost',
  api: process.env.XARXA_URL ?? 'http://localhost/api/v1',
  secret: process.env.XARXA_SECRET ?? '',
};
