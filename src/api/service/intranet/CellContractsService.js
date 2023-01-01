// @ts-check
'use strict';

const {
  intranet: { GfContract },
} = require('@models');
const { handle: SyncAireBonuses } = require('./Actions/SyncAireBonuses');
const {
  GfAireContract,
} = require('@api/models/intranet/intranet_gf_aire_contracts');

exports.checkBonosChange = async function () {
  await SyncAireBonuses(
    await GfAireContract.findAll({ include: { model: GfContract } }),
  );
};
