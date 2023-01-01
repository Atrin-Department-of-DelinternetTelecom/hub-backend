//@ts-check
'use strict';
const { revisionNumber } = require('@api/service/intranet/AireRevisionService');
const { flip } = require('@api/utils/collections');
const { sleep } = require('@api/utils/helpers');
const { MultiSimType } = require('@delinternet/sdk-aire');
const Action = require('@lib/crud/Action');
const Enum = require('@lib/crud/Fields/Enum');
const { Aire } = require('@lib/sdk');
const { default: to } = require('await-to-js');
const assert = require('node:assert');

module.exports = class ConfigureSecondarySim extends Action {
  constructor(...args) {
    super(...args);
    this.direct();
  }

  /**
   * Preapre field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {{type: MultiSimType }} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const model = models[0];

    assert(
      model.number,
      `Contract with id:${model.contractId} has invalid number.`,
    );

    await Aire.configureSecondarySim({
      number: model.number,
      type: fields.type,
    });

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
      new Enum('type')
        .options(flip(MultiSimType))
        .default(MultiSimType.MULTISIM)
        .nullable(),
    ];
  }
};
