//@ts-check
'use strict';

const {
  handle: RefreshIvozLookup,
} = require('@api/service/intranet/Actions/RefreshIvozLookup');

const Action = require('@lib/crud/Action');

module.exports = class LookupIvoz extends Action {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @return {Promise<Object>}
   */
  async handle(request, models) {
    await RefreshIvozLookup(models.map(({ username }) => username));
  }

  /**
   * Get the uri key.
   *
   * @return {string}
   */
  uriKey() {
    return 'lookup-ivoz';
  }
};
