'use strict';

require('../init-tests');
const {
  getContractHistory,
} = require('src/api/service/intranet/GfContractService');
const { GfContractHolderChange, GfBonusHistory, GfContractUnpaid } =
  require('@models').intranet;

const { initDb } = require('../test-utils');

afterEach(async () => {
  // clean up the mess after test
  await GfContractHolderChange.destroy({
    where: {},
    truncate: true,
  });

  await GfBonusHistory.destroy({
    where: {},
    truncate: true,
  });

  await GfContractUnpaid.destroy({
    where: {},
    truncate: true,
  });
});

describe('GfContractService.getContractHistory tests', () => {
  it.skip('should work', async () => {
    const initDate = new Date(2020, 0, 1);
    const endDate = new Date(2020, 1, 1);

    const contract = {
      id: 1,
      uid: 90,
      clientId: 2,
      feeGroupId: 3,
      dateActivation: new Date(2020, 0, 1),
      dateExpiration: new Date(2020, 1, 1),
    };

    await initDb({
      GfContractHolderChange: {
        id: 8,
        uid: 90,
        contractId: contract.id,
        fromClientId: 3,
        toClientId: 2,
        changeDate: new Date(2020, 0, 15),
        state: 'done',
      },
      GfBonusHistory: {
        id: 9,
        bonoId: 10,
        xrefId: 12,
        contractId: contract.id,
        initDate: new Date(2020, 0, 17),
        endDate: null,
      },
      GfContractUnpaid: {
        id: 14,
        uid: 90,
        contractId: contract.id,
        init: new Date(2020, 0, 5),
        end: null,
        alive: 1,
        status: 1,
      },
    });

    const result = await getContractHistory(contract, initDate, endDate);

    expect(result?.holders).toEqual({
      2: [
        {
          init: '2020-01-15 00:00:00',
          end: '2020-02-01 00:00:00',
          _id: 8,
        },
      ],
      3: [
        {
          init: '2020-01-01 00:00:00',
          end: '2020-01-15 00:00:00',
          _id: 0,
        },
      ],
    });

    expect(result?.fees).toEqual({
      3: [
        {
          init: '2020-01-01 00:00:00',
          end: '2020-02-01 00:00:00',
          _id: 0,
        },
      ],
    });

    expect(result?.bonos).toEqual({
      10: {
        'xref-12': [
          {
            init: '2020-01-17 00:00:00',
            end: '2020-02-01 00:00:00',
          },
        ],
      },
    });

    expect(result?.blocked).toEqual([
      {
        init: '2020-01-05 00:00:00',
        end: '2500-01-01 00:00:00',
        _id: 14,
      },
    ]);
  });
});
