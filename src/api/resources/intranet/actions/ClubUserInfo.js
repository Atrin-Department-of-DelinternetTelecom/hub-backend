'use strict';

const Action = require('@lib/crud/Action');
const config = require('@config');
const assert = require('assert');
const { fetch } = require('undici');
const { errors, isHttpError } = require('@api/http/http_errors');
const _ = require('lodash');

const endpoint = config.get('index.club.endpoint', null);
const apiKey = config.get('index.club.apiKey', null);

module.exports = class ClubUserInfo extends Action {
  uriKey() {
    return _.kebabCase(this.name());
  }

  async handle(request, models) {
    const { fiscalId } = models[0] || {};

    if (!fiscalId) {
      throw new errors.BadRequest('fiscalId is required');
    }

    this.#validateEnv();

    const baseUrl = new URL(endpoint).origin;

    const res = await fetch(`${baseUrl}/api/v1/auth/user-info/${fiscalId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new errors.InternalServerError(
        `Failed to fetch user info: ${body}`,
      );
    }

    const result = await res.json();

    return {
      fiscalId: result.user.fiscalId,
      name: result.user.name,
      email: result.user.email,
    };
  }

  fields() {
    return [];
  }

  #validateEnv() {
    assert(endpoint, 'Missing club.endpoint in env');
    assert(apiKey, 'Missing club.apiKey in env');
  }
};
