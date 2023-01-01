//@ts-check
'use strict';
const Action = require('@lib/crud/Action');
const FacadeCell = require('@service/intranet/FacadeCell');
const TextField = require('@lib/crud/Fields/Text');
const { throwUnless } = require('@utils/helpers');
const assert = require('node:assert');

module.exports = class AddAireBonus extends Action {
  /**
   * Preapre field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {Object} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    models.forEach((model) => {
      assert(
        model.number,
        `Contract with id:${model.contractId} has invalid number.`,
      );
    });

    return Promise.all(
      models.map((model) => {
        return FacadeCell.setAireBono(model.contractId, fields.bono);
      }),
    );
  }

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new TextField('Bono')
        .required()
        .rules('required')
        .default('')
        .help('example: V00132'),
    ];
  }
};
