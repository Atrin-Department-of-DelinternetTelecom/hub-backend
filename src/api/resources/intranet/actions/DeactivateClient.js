//@ts-check
'use strict';
const Action = require('@lib/crud/Action');
const {
  intranet: { GfContract },
} = require('@api/models');
const {
  handle: MeiliSearchClientSync,
} = require('@api/service/intranet/Actions/MeiliSearchClientSync');
const { ActionEvent } = require('@api/models/crud/crud_action_event');
const { GfClient } = require('@api/models/intranet/intranet_gf_clients');
const { CONTRACT } = require('@api/constants/statuses');
const assert = require('assert');
const { default: to } = require('await-to-js');

const checkActiveContracts = async (clientId) => {
  const activeContract = await GfContract.findOne({
    where: {
      clientId: clientId,
      state: [CONTRACT.BLOCKED, CONTRACT.ACTIVE],
    },
    attributes: ['id'],
    raw: true,
  });
  assert(
    activeContract === null,
    `Client with id ${clientId} has some active contracts`,
  );
};
module.exports = class DeactivateClient extends Action {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array<GfClient>} models
   * @param {Object} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const client = models[0];

    await checkActiveContracts(client.id);
    await client.update({ active: 0 });

    ActionEvent.forResourceUpdate({
      payload: request.all(),
      userId: request.userId(),
      resource: client,
      original: client,
    }).markAsFinished();
    // update meilie search
    const [error] = await to(MeiliSearchClientSync(models.map(({ id }) => id)));
    if (error) console.warn(error);
  }
};
