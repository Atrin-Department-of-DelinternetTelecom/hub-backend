//@ts-check
'use strict';
const { revisionNumber } = require('@api/service/intranet/AireRevisionService');
const { sleep } = require('@api/utils/helpers');
const { MultiSimType } = require('@delinternet/sdk-aire/dist/methods/dualSim');
const Action = require('@lib/crud/Action');
const BooleanField = require('@lib/crud/Fields/Boolean');
const Enum = require('@lib/crud/Fields/Enum');
const Text = require('@lib/crud/Fields/Text');
const { Aire } = require('@lib/sdk');
const { default: to } = require('await-to-js');
const assert = require('node:assert');

module.exports = class AssignSecondarySim extends Action {
  constructor(...args) {
    super(...args);
    this.direct();
  }

  /**
   * Preapre field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {{icc: string, esim: boolean, email: string, type: MultiSimType}} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const model = models[0];

    assert(
      model.number,
      `Contract with id:${model.contractId} has invalid number.`,
    );

    const result = (await fields.esim)
      ? Aire.assignSecondaryESim({
          number: model.number,
          type: fields.type,
          email: fields.email,
        })
      : Aire.assignSecondarySim({
          number: model.number,
          type: fields.type,
          icc: fields.icc,
        });

    await sleep(5000);

    const [err] = await to(revisionNumber(model.number));

    if (err) {
      console.error(err);
    }

    return result;
  }

  /**
   * Get the list of fields.
   */
  fields(request) {
    return [
      new Text('icc')
        .required()
        .rules('requiredIf:esim,false')
        .help('Secondary sim card icc.'),
      new BooleanField('esim')
        .nullable()
        .default(false)
        .help('Determine that new sim should be esim.'),
      new Text('email').rules('requiredIf:esim,true').nullable().default(''),
      new Enum('type')
        .options(MultiSimType)
        .default(MultiSimType.MULTISIM)
        .nullable(),
    ];
  }
};
