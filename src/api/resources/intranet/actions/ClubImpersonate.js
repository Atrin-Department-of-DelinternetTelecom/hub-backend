'use strict';
const Action = require('@lib/crud/Action');
const config = require('@config');
const assert = require('assert');
const { fetch } = require('undici');

const endpoint = config.get('index.club.endpoint', null);
const apiKey = config.get('index.club.apiKey', null);
const impersonateUrl = config.get('index.club.impersonateUrl', null);
const _ = require('lodash');
const { errors } = require('@api/http/http_errors');
module.exports = class ClubImpersonate extends Action {
  uriKey() {
    return _.kebabCase(this.name());
  }

  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {Object} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const fiscalId = models[0].fiscalId;
    if (!fiscalId) {
      throw new errors.BadRequest('fiscalId is required');
    }

    const token = await this.#getToken(fiscalId);
    const url = this.#createUrl(token);

    return {
      url,
    };
  }

  #getToken = async (fiscalId) => {
    assert(endpoint, 'Missing club.endpoint in env');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        fiscalId,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to get token: ${body}`);
    }

    const {
      data: { token },
    } = await response.json();
    return token;
  };

  #createUrl = (token) => {
    assert(impersonateUrl, 'Missing club.impersonateUrl in env');
    const url = new URL(impersonateUrl);
    url.searchParams.append('token', token);
    return url.toString();
  };

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields() {
    return [];
  }
};
