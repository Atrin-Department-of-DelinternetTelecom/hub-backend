//@ts-check
'use strict';
const { revisionNumber } = require('@api/service/intranet/AireRevisionService');
const { sleep } = require('@api/utils/helpers');
const Action = require('@lib/crud/Action');
const BooleanField = require('@lib/crud/Fields/Boolean');
const Text = require('@lib/crud/Fields/Text');
const { Aire } = require('@lib/sdk');
const { default: to } = require('await-to-js');
const assert = require('node:assert');

module.exports = class ExchangeSimCard extends Action {
  constructor(...args) {
    super(...args);
    this.direct();
  }

  /**
   * Preapre field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {{icc_old: string, icc_new: string, esim: boolean, email: string}} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const model = models[0];

    assert(
      model.number,
      `Contract with id:${model.contractId} has invalid number.`,
    );

    if (fields.esim) {
      await Aire.exchangeByESim({
        number: model.number,
        icc_old: fields.icc_old,
        email: fields.email,
      });
    } else {
      await Aire.exchangeBySimCard({
        number: model.number,
        icc_old: fields.icc_old,
        icc_new: fields.icc_new,
      });
    }

    await sleep(5000);

    const [err] = await to(revisionNumber(model.number));

    if (err) {
      console.error(err);
    }

    return this.successResponse();
  }

  /**
   * Get the list of fields.
   */
  fields(request) {
    return [
      new Text('icc_old')
        .required()
        .rules('required')
        .help('Old sim card icc.'),
      new Text('icc_new')
        .nullable()
        .rules('requiredIf:esim,false')
        .help('New sim card icc.'),
      new BooleanField('esim')
        .nullable()
        .default(false)
        .help('Determine that new sim should be esim.'),
      new Text('email').rules('requiredIf:esim,true').nullable().default(''),
    ];
  }
};
