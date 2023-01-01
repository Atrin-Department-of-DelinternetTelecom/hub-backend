//@ts-check
'use strict';
const { flip } = require('@api/utils/collections');
const { SIM_ROLE } = require('@delinternet/sdk-aire');
const Action = require('@lib/crud/Action');
const Enum = require('@lib/crud/Fields/Enum');
const Text = require('@lib/crud/Fields/Text');
const { Aire } = require('@lib/sdk');
const assert = require('node:assert');

module.exports = class ResendValidationCode extends Action {
  constructor(...args) {
    super(...args);
    this.direct();
  }

  /**
   * Preapre field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {{role: SIM_ROLE, pool_number: string}} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const model = models[0];

    assert(
      model.number,
      `Contract with id:${model.contractId} has invalid number.`,
    );

    return Aire.sendEsimValidationCode({
      number: model.number,
      role: fields.role,
      poolNumber: fields.pool_number,
    });
  }

  fields() {
    return [
      new Enum('role')
        .options(flip(SIM_ROLE))
        .required()
        .default(SIM_ROLE.PRIMARY),
      new Text('pool_number')
        .default('')
        .required()
        .help('Pool number for the request (/aire/pool-esim).'),
    ];
  }
};
