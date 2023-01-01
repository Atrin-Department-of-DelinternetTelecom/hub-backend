'use strict';

const Action = require('@lib/crud/Action');
const config = require('@config');
const assert = require('assert');
const { fetch } = require('undici');
const { errors, isHttpError } = require('@api/http/http_errors');
const _ = require('lodash');

const checkUserExists = require('@api/service/3th-party/ClubUser').default;

const endpoint = config.get('index.club.endpoint', null);
const apiKey = config.get('index.club.apiKey', null);

module.exports = class ResendResetPassword extends Action {
  uriKey() {
    return _.kebabCase(this.name());
  }

  async handle(request, models) {
    const { fiscalId } = models[0] || {};

    if (!fiscalId) {
      throw new errors.BadRequest('fiscalId is required');
    }

    this.#validateEnv();

    await this.#validateUserExists(fiscalId);
    await this.#resendResetPassword(fiscalId);

    return { message: 'Reset password email resent successfully.' };
  }

  fields() {
    return [];
  }

  #validateEnv() {
    assert(endpoint, 'Missing club.endpoint in env');
    assert(apiKey, 'Missing club.apiKey in env');
  }

  async #validateUserExists(fiscalId) {
    try {
      const { exists } = await checkUserExists(fiscalId);

      if (!exists) {
        throw new errors.NotFound(
          `User with fiscalId "${fiscalId}" does not exist`,
        );
      }
    } catch (err) {
      if (isHttpError(err)) {
        throw err;
      }

      throw new errors.InternalServerError(
        `Failed to validate user existence: ${err?.message || 'Unknown error'}`,
      );
    }
  }

  async #resendResetPassword(fiscalId) {
    const baseUrl = new URL(endpoint).origin;

    const res = await fetch(`${baseUrl}/api/v2/auth/resend-reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ fiscalId }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to resend email: ${body}`);
    }
  }
};
