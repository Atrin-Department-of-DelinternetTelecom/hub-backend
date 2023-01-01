//@ts-check
'use strict';
const Action = require('@lib/crud/Action');

const {
  handle: SyncClientsWithAire,
} = require('@api/service/intranet/Actions/SyncClientsWithAire');
const NumberField = require('@lib/crud/Fields/Number');
const { GfClient } = require('@api/models/intranet/intranet_gf_clients');
const { Op } = require('sequelize');
const {
  GfAireContractSyncError,
} = require('@api/models/intranet/intranet_gf_aire_contracts_sync_errors');
const {
  GfAireContract,
} = require('@api/models/intranet/intranet_gf_aire_contracts');
const {
  handle: RevisionCellContracts,
} = require('@api/service/intranet/Actions/RevisionCellContracts');
const { pluck } = require('@api/utils/collections');

module.exports = class FixMissingAireCodes extends Action {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array<GfClient>} models
   * @param {{from:number,to:number}} fields
   * @return {Promise<any>}
   */
  async handle(request, models, fields) {
    const errors = await GfAireContractSyncError.findAll({
      where: {
        id: { [Op.between]: [fields.from, fields.to] },
        code: 'client_not_sincronized_to_aire',
      },
      include: [{ model: GfAireContract }],
    });

    const fiscalIds = errors.map(
      ({ GfAireContract }) => GfAireContract.getAireData()?.fiscalId,
    );

    // await GfClient.update({ active: 1 }, { where: { fiscalId: fiscalIds } });
    const results = await SyncClientsWithAire(
      await GfClient.findAll({ where: { fiscalId: fiscalIds } }),
    );

    await RevisionCellContracts(
      pluck(errors, 'GfAireContract'),
      request.propertyIsEnumerable.userId,
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
