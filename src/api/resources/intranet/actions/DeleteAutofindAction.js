'use strict';

const Action = require('@lib/crud/Action');
const Text = require('@lib/crud/Fields/Text');
const axios = require('axios');
const { trimEnd } = require('lodash');
const { get: config } = require('@config');
const { errors } = require('@api/http/http_errors');

function getEbraConfig() {
  const conf = config('ebra') || {};

  const endpoint = String(conf.endpoint || '').trim();
  const token = String(conf.token || '').trim();

  if (!endpoint) {
    throw new errors.InternalServerError('Ebra API endpoint not configured');
  }

  if (!token) {
    throw new errors.InternalServerError('Ebra API key not configured');
  }

  return { endpoint, token };
}

function validateSerialNumber(serial_number) {
  const sn = String(serial_number || '').trim();

  if (!sn) {
    throw new errors.BadRequest('Invalid serial number');
  }

  return sn;
}

function buildUrl(endpoint, serial_number) {
  return trimEnd(endpoint, '/') + '/discover/' + serial_number;
}

async function callDeleteApi(url, token, serial_number) {
  try {
    const response = await axios.delete(url, {
      headers: {
        accept: '*/*',
        'x-api-key': token,
      },
    });

    return response.data;
  } catch (error) {
    console.error(`[Ebra][DELETE][${serial_number}]: ${error.message}`);
    throw new errors.InternalServerError(error.message);
  }
}

async function deleteBySerial(serial_number) {
  const { endpoint, token } = getEbraConfig();
  const sn = validateSerialNumber(serial_number);
  const url = buildUrl(endpoint, sn);

  return callDeleteApi(url, token, sn);
}

module.exports = class DeleteAutofindAction extends Action {
  async handle(request, models, { serial_number } = {}) {
    return deleteBySerial(serial_number);
  }

  fields() {
    return [new Text('serial_number').required()];
  }
};
