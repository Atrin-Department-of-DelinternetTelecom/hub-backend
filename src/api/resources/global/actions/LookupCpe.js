//@ts-check
'use strict';

const {
  handle: RefreshCpeLookups,
} = require('@api/service/intranet/Actions/RefreshCpeLookups');

const Action = require('@lib/crud/Action');

module.exports = class LookupCpe extends Action {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @return {Promise<Object>}
   */
  async handle(request, models) {
    await RefreshCpeLookups(models.map(({ serial_number }) => serial_number));
  }
};
