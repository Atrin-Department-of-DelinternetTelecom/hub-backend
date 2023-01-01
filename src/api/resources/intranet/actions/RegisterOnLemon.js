// @ts-nocheck
'use strict';
const Action = require('@lib/crud/Action');
const { ActionEvent } = require('@api/models/crud/crud_action_event');
const { lemon } = require('@lib/lemon');
const { default: to } = require('await-to-js');

module.exports = class RegisterOnLemon extends Action {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array<import('@api/models/intranet/intranet_gf_clients').GfClient>} models
   * @param {Object} fields
   * @return {Promise<Record<string, any>>}
   */
  async handle(request, models, fields) {
    const client = models[0];
    const [error] = await to(lemon.client.checkClient(client.fiscalId));

    if (error) {
      await lemon.client.createClient(await client.serializeForLemon());
      // log the action
      await ActionEvent.forAction({
        action: 'RegisterOnLemon',
      }).markAsFinished();
    }
  }
};
