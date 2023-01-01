'use strict';
const {
  GfContractDataInternet,
} = require('@api/models/intranet/intranet_gf_contract_data_internet');
const Action = require('@lib/crud/Action');
const NumberField = require('@lib/crud/Fields/Number');
const { Op } = require('sequelize');
const {
  bulkUpdateIpSix,
} = require('@api/service/intranet/GfContractDataInternetService');

module.exports = class BulkUpdateIpSix extends Action {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {Object} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    let page = 1;
    const where = {
      IPv6_prefix: { [Op.or]: [null, ''] },
      id: { [Op.gte]: fields.start ?? 0 },
    };
    const count = await GfContractDataInternet.count({ where });
    const updates = [];
    while (page * fields.per_page <= fields.limit && count > 0) {
      const dataInternets = await GfContractDataInternet.findAll({
        where,
        limit: fields.per_page,
        offset: fields.per_page * page,
      });
      // update radius
      await bulkUpdateIpSix(dataInternets);
      // do it for next apge
      page++;
      updates.push(dataInternets.map(({ contractId }) => contractId));
    }

    return updates.flat();
  }

  fields() {
    return [
      new NumberField('per_page').default(20).rules('required'),
      new NumberField('limit').default(100).rules('required'),
      new NumberField('start').default(0).rules('required'),
    ];
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
              type: 'number',
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
