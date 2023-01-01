//@ts-check
'use strict';
const Action = require('@lib/crud/Action');
const { Aire } = require('@lib/sdk');

module.exports = class CancelAireRequest extends Action {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {Object} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    return Promise.all(
      models.map((model) => Aire.cancelRequestLine({ codigo: model.code })),
    );
  }
};
