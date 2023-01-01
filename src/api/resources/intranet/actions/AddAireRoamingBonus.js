//@ts-check
'use strict';
const Action = require('@lib/crud/Action');
const assert = require('node:assert');
const { Aire } = require('@lib/sdk');
const Text = require('@lib/crud/Fields/Text');

module.exports = class AddAireRoamingBonus extends Action {
  constructor() {
    super();
    this.direct();
  }

  /**
   * Preapre field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {{bonusId:number|string}} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const number = models[0].number;
    assert(
      number,
      `Contract with id:${models[0].contractId} has invalid number.`,
    );

    assert(fields.bonusId);

    await Aire.setLineRoamingBonus(number, fields.bonusId);
  }

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [new Text('bonusId', 'bonusId').required().rules('required')];
  }
};
