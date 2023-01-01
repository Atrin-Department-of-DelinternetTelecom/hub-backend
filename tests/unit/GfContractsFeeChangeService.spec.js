'use strict';

require('../init-tests');
const GfContractsFeeChangeService = require('src/api/service/intranet/GfContractsFeeChangeService');
const { GfContract, GfContractFeeChange, GfFeegroupsSectionsXref } =
  require('@models').intranet;

afterAll(async () => {
  // clean up the mess after test
  await GfContract.destroy({
    where: {},
    truncate: true,
  });
  await GfContractFeeChange.destroy({
    where: {},
    truncate: true,
  });
});

describe('GfContractsFeeChangeService.changeDone tests', () => {
  it.skip('should work', async () => {
    // init context
    await GfContract.create({
      id: 1,
      uid: -1,
      userId: 1,
      linkedContractId: 1,
    });

    await GfContractFeeChange.create({
      id: 1,
      uid: -1,
      contractId: 1,
      fromFeeGroupId: 1,
      toFeeGroupId: 1,
      status: 1,
      done: 0,
    });
    // end init context

    const result = await GfContractsFeeChangeService.changeDone({
      contractFeeChangeId: 1,
      userId: 1,
    });

    expect(result).toBe(true);
  });
});
