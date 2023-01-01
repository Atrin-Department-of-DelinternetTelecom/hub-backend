//@ts-check
'use strict';
const { CELL_PROVIDER_CODE } = require('@api/constants/contracts');
const { RevisionGroup } = require('@api/constants/enum');
const {
  GfCellProviderFee,
} = require('@api/models/intranet/intranet_gf_cell_providers_fees');
const {
  handle: ImportAireTarifas,
} = require('@api/service/intranet/Actions/ImportAireTarifas');
const {
  handle: ImportLemonTarifas,
} = require('@api/service/intranet/Actions/ImportLemonTarifas');
const {
  handle: SyncProviderFees,
} = require('@api/service/intranet/Actions/SyncProviderFees');
const {
  handle: RevisionCellContracts,
} = require('@api/service/intranet/Actions/RevisionCellContracts');
const {
  handle: RevisionLemonContracts,
} = require('@api/service/intranet/Actions/RevisionLemonContracts');
const Action = require('@lib/crud/Action');
const assert = require('assert');
const {
  GfAireContract,
} = require('@api/models/intranet/intranet_gf_aire_contracts');
const { LemonLine } = require('@api/models/intranet/intranet_lemon_line');

module.exports = class ResolveProviderFee extends Action {
  constructor() {
    super();
    this.direct();
  }

  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {Object} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const fee = models[0].fee;
    const number = models[0].number;
    const fiscalId = models[0].fiscal_id;
    assert(
      models[0].group === RevisionGroup.FEE,
      'Invalid group of the revision error!',
    );
    assert(fee, "Record doesn't have any fee!");

    console.log('[ResolveProviderFee][Step:1] Updating provider fees ...');
    if (models[0].provider === CELL_PROVIDER_CODE.AIRE) {
      await ImportAireTarifas();
    } else {
      await ImportLemonTarifas();
    }

    console.log('[ResolveProviderFee][Step:2] Importing provider fees ...');
    await SyncProviderFees(
      await GfCellProviderFee.findAll({ where: { tpvCode: fee } }),
    );

    console.log('[ResolveProviderFee][Step:3] Revision cell contracts');

    if (models[0].provider === CELL_PROVIDER_CODE.AIRE) {
      await RevisionCellContracts(
        await GfAireContract.findAll({
          where: { number, siglas: fee },
        }),
      );
    } else {
      await RevisionLemonContracts(
        await LemonLine.findAll({
          where: { number, fiscal_id: fiscalId },
        }),
      );
    }
  }
};
