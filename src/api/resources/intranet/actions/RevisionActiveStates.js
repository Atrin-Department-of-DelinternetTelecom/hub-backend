//@ts-check
'use strict';
const Action = require('@lib/crud/Action');
const {
  handle: MeiliSearchClientSync,
} = require('@api/service/intranet/Actions/MeiliSearchClientSync');
const uuid = require('uuid');
const NumberField = require('@lib/crud/Fields/Number');
const { GfClient } = require('@api/models/intranet/intranet_gf_clients');
const { ActionEvent } = require('@api/models/crud/crud_action_event');

module.exports = class RevisionActiveStates extends Action {
  /**
   * Prepare field for json.
   *
   * @param {Object} req
   * @param {Array} models
   * @param {{limit: number}} fields
   * @return {Promise<Object>}
   */
  async handle(req, models, fields) {
    const resources = req.input('resources', []);
    const inactivated = [];
    const clients = await GfClient.findAll(
      Array.isArray(resources) && resources.length > 0
        ? { where: { id: resources } }
        : { limit: fields.limit },
    );
    const batchId = uuid.v4();
    const updates = clients.filter(
      (client) => !client.isActive() && !!client.active,
    );

    await Promise.all(
      updates.map(async (item) => {
        item.set({ active: false });

        await ActionEvent.forAction({
          payload: req.all(),
          userId: req.userId(),
          action: 'RevisionActiveStates',
          resource: item,
          batchId,
        }).markAsFinished();

        await item.save();
        inactivated.push(item.id);
      }),
    );

    // update meilie search
    await MeiliSearchClientSync(updates.map(({ id }) => id));

    return inactivated;
  }

  /**
   * Get the list of fields.
   *
   * @param {Object} req
   * @return {array}
   */
  fields() {
    return [new NumberField('limit').default(10)];
  }
};
