'use strict';

require('../init-tests');
const {
  generateIlines,
  calculateLocalFeesAndBonos,
} = require('src/api/service/intranet/GfInvoiceService');
const {
  GfFee,
  GfBonus,
  GfContract,
  GfClient,
  GfContractSectionStatus,
  GfSection,
  GfContractDataInternet,
} = require('@models').intranet;
const moment = require('moment');
const { initDb } = require('../test-utils');

beforeAll(async () => {
  await GfFee.destroy({
    where: {},
    truncate: true,
  });

  await GfBonus.destroy({
    where: {},
    truncate: true,
  });

  await GfContract.destroy({
    where: {},
    truncate: true,
  });

  await GfClient.destroy({
    where: {},
    truncate: true,
  });

  await GfContractSectionStatus.destroy({
    where: {},
    truncate: true,
  });

  await GfSection.destroy({
    where: {},
    truncate: true,
  });

  await GfContractDataInternet.destroy({
    where: {},
    truncate: true,
  });
});

describe.skip('GfInvoiceService.calculateLocalFeesAndBonos', () => {
  it('should work', async () => {
    const clientId = 5;

    const history = {
      holders: {
        [clientId]: [
          {
            init: '2020-01-15 00:00:00',
            end: '2020-02-01 00:00:00',

            _id: 8,
          },
        ],
      },
      fees: {
        [clientId]: [
          {
            init: '2020-01-01 00:00:00',
            end: '2020-02-01 00:00:00',
            _id: 0,
          },
        ],
      },
      bonos: {
        [clientId]: {
          'xref-12': {
            init: '2020-01-17 00:00:00',
            end: '2020-02-01 00:00:00',
          },
        },
      },
      blocked: [
        {
          init: '2020-01-05 00:00:00',
          end: '2500-01-01 00:00:00',
          _id: 14,
        },
      ],
    };

    const months = {
      202001: {
        init: '2020-01-01 12:00:00',
        end: '2020-01-31 12:00:59',
        daysInMonth: 31,
      },
      202002: {
        init: '2020-02-01 12:00:00',
        end: '2020-02-29 12:00:59',
        daysInMonth: 29,
      },
    };

    await GfFee.create({
      id: 10,
      uid: 90,
      feeGroupId: clientId,
      fromDate: '2019-01-01',
      baseQuote: 100,
      status: 1,
    });

    await GfBonus.create({
      id: clientId,
      uid: 90,
      prorotable: true,
      pvp: 100,
    });

    const result = await calculateLocalFeesAndBonos(history, months, clientId);
    expect(result.success).toBe(true);
    expect(typeof result.total).toBe('number');
    expect(result.feeAbstract).toHaveProperty('5');
    expect(result.bonosAbstract).toHaveProperty('5');
  });
});

describe.skip('GfInvoiceService.generateIlines', () => {
  it('should work', async () => {
    const period = {
      initDate: moment('2020-01-01'),
      endDate: moment('2020-01-31'),
    };

    const contractId = 1;
    const clientId = 11;
    const feeGroupId = 8;

    await initDb({
      GfClient: {
        id: clientId,
        uid: 90,
        active: 1,
        userId: 15,
        name: 'Cliente',
      },
      GfContract: {
        id: 1,
        uid: -1,
        userId: 1,
        linkedContractId: 1,
        reference: 'ref',
        alias: 'alias',
        comments: 'comments',
        state: 'active',
        imported: 2,
        clientId,
        payDay: 4,
        invoiceMonths: 5,
        invoiceProfileId: 6,
        feeGroupId: feeGroupId,
        percentageDiscount: 7.7,
      },
      GfSection: {
        id: 1,
        uid: -1,
        code: 'INTERNET',
        name: 'name',
        status: 1,
      },
      GfContractSectionStatus: {
        id: 1,
        uid: -1,
        contractId: 1,
        sectionId: 1,
        state: 'pending',
      },
      GfContractDataInternet: {
        id: 1,
        uid: -1,
        contractId: 1,
        ip: 'ip',
        staticIp: 'staticIp',
        mac: 'mac',
      },
      GfFee: {
        id: 1,
        uid: 90,
        feeGroupId: feeGroupId,
        fromDate: '2019-01-01',
        tpvCode: 'tpvCode',
        baseQuote: 100,
        status: 1,
      },
      GfFeeGroup: {
        id: feeGroupId,
        uid: 90,
        active: 1,
        name: 'gf fee group name',
        internalName: 'gf fee group internal name',
        status: 1,
      },
      GfBonus: {
        id: clientId,
        uid: 90,
        prorotable: true,
        pvp: 100,
      },
    });

    const result = await generateIlines(period, contractId, clientId);
    expect(result?.success).toBe(true);
  });
});
