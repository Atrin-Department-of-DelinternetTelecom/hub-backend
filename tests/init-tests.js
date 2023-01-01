'use strict';

require('dotenv').config({
  path: '.env.test',
});

/**
 * To fix jest problem with mysql2
 * @see https://github.com/sidorares/node-mysql2/issues/489#issuecomment-272682164
 */
// eslint-disable-next-line node/no-extraneous-require
const iconv = require('iconv-lite');
// eslint-disable-next-line node/no-extraneous-require
const encodings = require('iconv-lite/encodings');
iconv.encodings = encodings;
