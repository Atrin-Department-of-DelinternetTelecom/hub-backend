//@ts-check
'use strict';

const {
  handle: RefreshRadiusLookup,
} = require('@api/service/intranet/Actions/RefreshRadiusLookup');

const Action = require('@lib/crud/Action');

module.exports = class LookupRadius extends Action {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @return {Promise<Object>}
   */
  async handle(request, models) {
    await RefreshRadiusLookup(models.map(({ username }) => username));
  }

  /**
   * Get the uri key.
   *
   * @return {string}
   */
  uriKey() {
    return 'lookup-radius';
  }
};
