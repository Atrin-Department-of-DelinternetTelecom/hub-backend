//@ts-check
'use strict';
const { revisionNumber } = require('@api/service/intranet/AireRevisionService');
const { flip } = require('@api/utils/collections');
const { sleep } = require('@api/utils/helpers');
const { SIM_ROLE } = require('@delinternet/sdk-aire');
const Action = require('@lib/crud/Action');
const Enum = require('@lib/crud/Fields/Enum');
const { Aire } = require('@lib/sdk');
const { default: to } = require('await-to-js');
const assert = require('node:assert');

module.exports = class RevokeEsimRequest extends Action {
  constructor(...args) {
    super(...args);
    this.direct();
  }

  /**
   * Preapre field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {{role: SIM_ROLE}} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const model = models[0];

    assert(
      model.number,
      `Contract with id:${model.contractId} has invalid number.`,
    );

    const result = await Aire.cancelRequestESIM({
      number: model.number,
      role: fields.role,
    });

    await sleep(5000);

    const [err] = await to(revisionNumber(model.number));

    if (err) {
      console.error(err);
    }

    return result;
  }

  fields() {
    return [new Enum('role').options(flip(SIM_ROLE)).required()];
  }
};
