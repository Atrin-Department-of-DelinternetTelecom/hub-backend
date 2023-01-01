'use strict';

require('../init-tests');
const {
  destroyInvoiceClientsInvoiceProfilesId,
  deleteInvoiceClientsInvoiceProfilesId,
} = require('src/api/service/intranet/InvoiceClientsInvoiceProfileService');
const {
  intranet: { InvoiceClientsInvoiceProfile, GfClient, GfContract },
} = require('@models');
const { initDb } = require('tests/test-utils');

afterEach(async () => {
  // clean up the mess after test
  await GfContract.destroy({
    truncate: true,
  });
  await GfClient.destroy({
    truncate: true,
  });
  await InvoiceClientsInvoiceProfile.destroy({
    truncate: true,
  });
});

describe('InvoiceClientsInvoiceProfileService.destroyInvoiceClientsInvoiceProfilesId tests', () => {
  it('should remove invoiceProfileId from related contracts', async () => {
    // init context
    await initDb({
      InvoiceClientsInvoiceProfile: {
        id: 1,
        uid: 90,
        clientId: 1,
        payday: 0,
      },
      GfContract: {
        id: 1,
        uid: 90,
        invoiceProfileId: 1,
        payday: 0,
      },
    });
    // end init context
    await destroyInvoiceClientsInvoiceProfilesId(1);
    const contracts = await GfContract.findAll({
      where: { invoiceProfileId: 1 },
    });
    expect(contracts.length).toBe(0);
  });
});

describe('InvoiceClientsInvoiceProfileService.deleteInvoiceClientsInvoiceProfilesId tests', () => {
  it('should remove invoiceProfileId from related contracts', async () => {
    await initDb({
      InvoiceClientsInvoiceProfile: {
        id: 1,
        uid: 90,
        clientId: 1,
        payday: 0,
      },
      GfContract: {
        id: 1,
        uid: 90,
        invoiceProfileId: 1,
        payday: 0,
      },
    });

    // end init context
    await deleteInvoiceClientsInvoiceProfilesId(1);
    const contracts = await GfContract.findAll({
      where: { invoiceProfileId: 1 },
    });
    expect(contracts.length).toBe(0);
  });
});
