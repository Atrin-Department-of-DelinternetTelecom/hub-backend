//@ts-check
'use strict';

const {
  handle: ProcessChangeIbanRequest,
} = require('@api/service/intranet/Actions/ProcessChangeIbanRequest');
const Action = require('@lib/crud/Action');

module.exports = class Apply extends Action {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param fields {{iban: string, bic: string, bank: string}} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    await ProcessChangeIbanRequest(models);
  }
};
