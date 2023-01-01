'use strict';

const Action = require('@lib/crud/Action');
const config = require('@config');
const assert = require('assert');
const { fetch } = require('undici');
const { errors, isHttpError } = require('@api/http/http_errors');
const _ = require('lodash');
const Text = require('@lib/crud/Fields/Text');

const checkUserExists = require('@api/service/3th-party/ClubUser').default;

const endpoint = config.get('index.club.endpoint', null);
const apiKey = config.get('index.club.apiKey', null);

module.exports = class ClubChangePassword extends Action {
  uriKey() {
    return _.kebabCase(this.name());
  }

  async handle(request, models, fields) {
    const { fiscalId } = models[0] || {};
    const { password: newPassword } = fields || {};

    if (!fiscalId) {
      throw new errors.BadRequest('fiscalId is required');
    }

    if (!newPassword) {
      throw new errors.BadRequest('Password is required');
    }

    this.#validateEnv();

    await this.#validateUserExists(fiscalId);

    await this.#changePassword(fiscalId, newPassword);

    return { message: 'Password updated successfully.' };
  }

  fields() {
    return [
      new Text('password')
        .required()
        .rules('required')
        .help('Set a password for manual activation'),
    ];
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
      if (isHttpError(err)) throw err;

      throw new errors.InternalServerError(
        `Failed to validate user existence: ${err?.message || 'Unknown error'}`,
      );
    }
  }

  async #changePassword(fiscalId, newPassword) {
    const baseUrl = new URL(endpoint).origin;

    const res = await fetch(`${baseUrl}/api/v2/auth/change-password-service`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ fiscalId, newPassword }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Password change failed: ${body}`);
    }
  }
};
