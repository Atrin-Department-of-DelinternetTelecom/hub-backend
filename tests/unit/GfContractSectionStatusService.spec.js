'use strict';

require('../init-tests');
const GfContractSectionStatusService = require('src/api/service/intranet/GfContractSectionStatusService');
const {
  GfContract,
  GfContractDataCell,
  GfContractDataFix,
  GfContractDataInternet,
  GfContractSectionStatus,
  GfSection,
} = require('@models').intranet;

beforeEach(async () => {
  // clean up the mess after test
  // await GfContract.destroy({
  //   where: {},
  //   truncate: true,
  // });
  await GfContractSectionStatus.destroy({
    where: {},
    truncate: true,
  });

  await GfSection.destroy({
    where: {},
    truncate: true,
  });

  await GfContract.destroy({
    where: {},
    truncate: true,
  });

  await GfContractDataCell.destroy({
    where: {},
    truncate: true,
  });

  await GfContractDataFix.destroy({
    where: {},
    truncate: true,
  });

  await GfContractDataInternet.destroy({
    where: {},
    truncate: true,
  });
});

describe('GfContractSectionStatusService.findForContract tests', () => {
  it('should work', async () => {
    // init context
    await GfContract.create({
      id: 1,
      uid: -1,
      userId: 1,
      linkedContractId: 1,
      reference: 'ref',
      alias: 'alias',
      comments: 'comments',
      imported: 2,
      clientId: 3,
      payDay: 4,
      invoiceMonths: 5,
      invoiceProfileId: 6,
      feeGroupId: 40,
      percentageDiscount: 7.7,
    });

    await GfSection.create({
      id: 1,
      uid: -1,
      code: 'code',
      name: 'name',
      status: 1,
      creationDate: new Date(),
      updateDate: new Date(),
    });

    await GfContractSectionStatus.create({
      id: 1,
      uid: -1,
      contractId: 1,
      sectionId: 1,
      state: 'pending',
      creationDate: new Date(),
      updateDate: new Date(),
    });

    await GfContractDataInternet.create({
      id: 1,
      uid: -1,
      contractId: 1,
      ip: 'ip',
      staticIp: 'staticIp',
      mac: 'mac',
    });

    // end init context

    const result = await GfContractSectionStatusService.findForContract(1);
    expect(result).toBeTruthy();
    expect(result.type).toBe('code');
    expect(result.section.status.id).toBe(1);
    expect(result.section.status.state).toBe('pending');
    expect(result.section.status.contract.id).toBe(1);
    expect(result.section.status.contract.dataInternet.id).toBe(1);
  });
});

describe('GfContractSectionStatusService.setDoneState tests', () => {
  it.skip('should work', async () => {
    // init context

    await GfContract.create({
      id: 1,
      uid: -1,
      userId: 1,
      linkedContractId: 1,
      reference: 'ref',
      alias: 'alias',
      comments: 'comments',
      imported: 2,
      clientId: 3,
      payDay: 4,
      invoiceMonths: 5,
      invoiceProfileId: 6,
      feeGroupId: 40,
      percentageDiscount: 7.7,
    });

    await GfSection.create({
      id: 1,
      uid: -1,
      code: 'code',
      name: 'name',
      status: 1,
      creationDate: new Date(),
      updateDate: new Date(),
    });

    await GfContractSectionStatus.create({
      id: 1,
      uid: -1,
      contractId: 1,
      sectionId: 1,
      state: 'pending',
      creationDate: new Date(),
      updateDate: new Date(),
    });

    await GfContractDataInternet.create({
      id: 1,
      uid: -1,
      contractId: 1,
      ip: 'ip',
      staticIp: 'staticIp',
      mac: 'mac',
    });

    // end init context
    Error.stackTraceLimit = 50; // TODO: remove after fix

    const result = await GfContractSectionStatusService.setDoneState(1, 1, 5);
    console.log(result);

    // TODO: add asserts
  });
});
