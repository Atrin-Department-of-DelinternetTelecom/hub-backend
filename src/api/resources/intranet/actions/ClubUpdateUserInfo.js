'use strict';

const Action = require('@lib/crud/Action');
const config = require('@config');
const assert = require('assert');
const { fetch } = require('undici');
const { errors, isHttpError } = require('@api/http/http_errors');
const _ = require('lodash');

const endpoint = config.get('index.club.endpoint', null);
const apiKey = config.get('index.club.apiKey', null);

module.exports = class ClubUpdateUserInfo extends Action {
  uriKey() {
    return _.kebabCase(this.name());
  }

  async handle(request, models) {
    const { fiscalId, name, emailAddress } = models[0] || {};

    if (!fiscalId || !name || !emailAddress) {
      throw new errors.BadRequest(
        'fiscalId, name, and emailAddress are required',
      );
    }

    this.#validateEnv();

    const baseUrl = new URL(endpoint).origin;

    const res = await fetch(`${baseUrl}/api/v1/user-info/${fiscalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ name, email: emailAddress }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new errors.InternalServerError(
        `Failed to update user info: ${body}`,
      );
    }

    return { message: 'User info updated successfully.' };
  }

  fields() {
    return [];
  }

  #validateEnv() {
    assert(endpoint, 'Missing club.endpoint in env');
    assert(apiKey, 'Missing club.apiKey in env');
  }
};
