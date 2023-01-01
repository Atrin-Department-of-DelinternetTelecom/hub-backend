//@ts-check
'use strict';
const Action = require('@lib/crud/Action');

const {
  handle: SyncClientsWithAire,
} = require('@api/service/intranet/Actions/SyncClientsWithAire');
const NumberField = require('@lib/crud/Fields/Number');
const { GfClient } = require('@api/models/intranet/intranet_gf_clients');
const { Op } = require('sequelize');

module.exports = class FillClientsWithAire extends Action {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array<GfClient>} models
   * @param {{from:number,to:number}} fields
   * @return {Promise<any>}
   */
  async handle(request, models, fields) {
    const results = await SyncClientsWithAire(
      await GfClient.findAll({
        where: { id: { [Op.between]: [fields.from, fields.to] } },
      }),
    );

    return results.filter((result) => result.status === 'rejected');
  }

  fields() {
    return [
      new NumberField('from').rules('required'),
      new NumberField('to').rules('required'),
    ];
  }
};
