//@ts-check
'use strict';
const { revisionNumber } = require('@api/service/intranet/AireRevisionService');
const { sleep } = require('@api/utils/helpers');
const Action = require('@lib/crud/Action');
const BooleanField = require('@lib/crud/Fields/Boolean');
const { Aire } = require('@lib/sdk');
const { default: to } = require('await-to-js');
const assert = require('node:assert');

module.exports = class ToggleSimState extends Action {
  constructor(...args) {
    super(...args);
    this.direct();
  }

  /**
   * Preapre field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {{primary: boolean, block: boolean }} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const model = models[0];

    assert(
      model.number,
      `Contract with id:${model.contractId} has invalid number.`,
    );

    const params = {
      number: model.number,
      primary: fields.primary,
    };

    if (fields.block) {
      await Aire.blockSim(params);
    } else {
      await Aire.unblockSim(params);
    }

    await sleep(5000);

    const [err] = await to(revisionNumber(model.number));

    if (err) {
      console.error(err);
    }
  }

  /**
   * Get the list of fields.
   */
  fields(request) {
    return [
      new BooleanField('block').default(false),
      new BooleanField('primary').default(true),
    ];
  }
};
