//@ts-check
'use strict';
const Action = require('@lib/crud/Action');
const { ActionEvent } = require('@api/models/crud/crud_action_event');
const {
  handle: MeiliSearchClientSync,
} = require('@api/service/intranet/Actions/MeiliSearchClientSync');
const uuid = require('uuid');
const { default: to } = require('await-to-js');
const { validateIban } = require('@api/service/intranet/IbanService');
const { firstPopulated } = require('@api/utils/helpers');
const { GfClient } = require('@api/models/intranet/intranet_gf_clients');
const NumberField = require('@lib/crud/Fields/Number');
const { Op } = require('sequelize');

module.exports = class RevisionBankNumbers extends Action {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {{limit: number}} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const resources = request.input('resources', []);
    const certainResources = Array.isArray(resources) && resources.length > 0;
    const batchId = uuid.v4();
    const updates = [];
    const where = certainResources
      ? { id: resources }
      : {
          [Op.or]: {
            bic: { [Op.or]: ['', null] },
            bicName: { [Op.or]: ['', null] },
          },
          [Op.and]: [{ iban: { [Op.not]: null } }, { iban: { [Op.not]: '' } }],
        };
    const clients = await GfClient.findAll({
      where,
      attributes: ['id', 'iban', 'bic', 'bicName'],
      limit: certainResources ? resources.length : fields.limit,
    });

    for (const client of clients) {
      if (!client.iban || (client.bic && client.bicName)) {
        continue;
      }

      const [error, iban] = await to(validateIban(client.iban));

      if (error) {
        console.warn(error);
        continue;
      }

      client.set({
        bic: firstPopulated([client.bic, iban.unwrap().bic]),
        bicName: firstPopulated([client.bicName, iban.unwrap().bank]),
      });

      await ActionEvent.forAction({
        payload: request.all(),
        userId: request.userId(),
        action: 'RevisionBankNumbers',
        resource: client,
        batchId,
      }).markAsFinished();

      await client.save();

      updates.push(client.id);
    }

    // update meilie search
    await MeiliSearchClientSync(clients.map(({ id }) => id));

    return updates;
  }

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields() {
    return [new NumberField('limit').default(10)];
  }
};
