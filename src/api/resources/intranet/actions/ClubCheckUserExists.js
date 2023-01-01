'use strict';

const Action = require('@lib/crud/Action');
const config = require('@config');
const assert = require('assert');
const { errors } = require('@api/http/http_errors');
const _ = require('lodash');

const request = require('@api/service/3th-party/ClubUser').default;

const endpoint = config.get('index.club.endpoint', null);
const apiKey = config.get('index.club.apiKey', null);

module.exports = class ClubCheckUserExists extends Action {
  uriKey() {
    return _.kebabCase(this.name());
  }

  async handle(_request, models) {
    const { fiscalId } = models[0] || {};

    this.#validateInput(fiscalId);
    this.#validateEnv();

    return await request(fiscalId); // ✅ Use the shared function
  }

  fields() {
    return [];
  }

  #validateInput(fiscalId) {
    if (!fiscalId) {
      throw new errors.BadRequest('fiscalId is required');
    }
  }

  #validateEnv() {
    assert(endpoint, 'Missing club.endpoint in env');
    assert(apiKey, 'Missing club.apiKey in env');
  }
};
