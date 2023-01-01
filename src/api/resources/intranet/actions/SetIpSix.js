'use strict';
const {
  bulkUpdateIpSix,
} = require('@api/service/intranet/GfContractDataInternetService');
const Action = require('@lib/crud/Action');

module.exports = class SetIpSix extends Action {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {Object} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    return bulkUpdateIpSix(models);
  }

  /**
   * Prepare resource for swager config.
   *
   * @return {Object}
   */
  swaggerResponse() {
    return {
      description: `Run action for given resources`,
      schema: {
        type: 'object',
        required: ['data', 'meta'],
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  example: 'rejected|fulfilled',
                },
                reason: {
                  type: 'object',
                },
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              code: {
                type: 'number',
                example: 201,
              },
              status: {
                type: 'string',
                minLength: 1,
                example: 'success',
              },
            },
            required: ['code', 'message', 'status'],
          },
        },
        description: `Resource created`,
      },
    };
  }
};
