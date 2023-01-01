//@ts-check
'use strict';
const Action = require('@lib/crud/Action');
const { throwUnless } = require('@utils/helpers');
const NumberField = require('@lib/crud/Fields/Number');
const { Aire } = require('@lib/sdk');

module.exports = class SetMaximumConsumption extends Action {
  /**
   * Preapre field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {{limit: string}} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    models.forEach((model) => {
      throwUnless(
        model.number,
        `Contract with id:${model.contractId} has invalid number.`,
      );
    });

    const result = await Promise.allSettled(
      models.map((model) => {
        return Aire.setMaximumConsumption({
          number: model.number,
          limit: parseInt(fields.limit),
        });
      }),
    );

    return result;
  }

  /**
   * Get the list of fields.
   */
  fields(request) {
    return [
      new NumberField('limit')
        .required()
        .rules('required')
        .default(0)
        .help('Maximum consumption value: {0:}'),
    ];
  }
};
