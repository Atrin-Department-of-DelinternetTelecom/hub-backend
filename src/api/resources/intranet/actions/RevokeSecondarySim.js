//@ts-check
'use strict';
const { revisionNumber } = require('@api/service/intranet/AireRevisionService');
const { sleep } = require('@api/utils/helpers');
const Action = require('@lib/crud/Action');
const { Aire } = require('@lib/sdk');
const { default: to } = require('await-to-js');
const assert = require('node:assert');

module.exports = class RevokeSecondarySim extends Action {
  constructor(...args) {
    super(...args);
    this.direct();
  }

  /**
   * Preapre field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {{icc: string}} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const model = models[0];

    assert(
      model.number,
      `Contract with id:${model.contractId} has invalid number.`,
    );

    const result = await Aire.revokeSecondarySim({ number: model.number });

    await sleep(5000);

    const [err] = await to(revisionNumber(model.number));

    if (err) {
      console.error(err);
    }

    return result;
  }
};
