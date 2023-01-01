'use strict';

const Action = require('@lib/crud/Action');
const config = require('@config');
const assert = require('assert');
const { fetch } = require('undici');
const { errors } = require('@api/http/http_errors');
const _ = require('lodash');
const Text = require('@lib/crud/Fields/Text');

const checkUserExists = require('@api/service/3th-party/ClubUser').default;

const endpoint = config.get('index.club.endpoint', null);
const apiKey = config.get('index.club.apiKey', null);

module.exports = class ClubManualActivation extends Action {
  uriKey() {
    return _.kebabCase(this.name());
  }

  async handle(_request, models, fields) {
    const { fiscalId, emailAddress: email } = models[0] || {};
    const { password } = fields || {};

    this.#validateInput(fiscalId, email, password);
    this.#validateEnv();

    // ✅ Check if user already exists
    const { exists } = await checkUserExists(fiscalId);

    if (!exists) {
      await this.#activateUser({ fiscalId, email, password });
      return { message: 'User activated successfully.' };
    }

    return { message: 'User already exists. Activation skipped.' };
  }

  fields() {
    return [
      new Text('password')
        .required()
        .rules('required')
        .help('Set a password for manual activation'),
    ];
  }

  #validateInput(fiscalId, email, password) {
    if (!fiscalId || !email) {
      throw new errors.BadRequest('fiscalId and email are required');
    }
    if (!password) {
      throw new errors.BadRequest('Password is required');
    }
  }

  #validateEnv() {
    assert(endpoint, 'Missing club.endpoint in env');
    assert(apiKey, 'Missing club.apiKey in env');
  }

  async #activateUser({ fiscalId, email, password }) {
    const baseUrl = new URL(endpoint).origin;

    const res = await fetch(`${baseUrl}/api/v2/auth/manual-activation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ fiscalId, email, password }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Manual activation failed: ${body}`);
    }
  }
};
