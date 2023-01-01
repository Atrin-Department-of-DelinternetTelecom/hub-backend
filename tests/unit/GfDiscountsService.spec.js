'use strict';

require('../init-tests');
const {
  generateDiscountLines,
  getTodayDiscountsToApply,
  checkUpToDate,
  setApplied,
} = require('src/api/service/intranet/GfDiscountsService');
const {
  GfDiscountsExecuted,
  GfDiscountsScheduled,
  GfContractHolderChange,
  GfContract,
} = require('@models').intranet;
const moment = require('moment');

afterEach(async () => {
  // clean up the mess after test
  await GfDiscountsExecuted.destroy({
    where: {},
    truncate: true,
  });

  await GfDiscountsScheduled.destroy({
    where: {},
    truncate: true,
  });

  await GfContractHolderChange.destroy({
    where: {},
    truncate: true,
  });

  await GfContract.destroy({
    where: {},
    truncate: true,
  });
});

describe.skip('GfDiscountsService.generateDiscountLines tests', () => {
  it('should work', async () => {
    // init context
    await GfDiscountsExecuted.create({
      id: 1,
      uid: 90,
      targetContractId: 1,
      matrixId: 1,
      active: 0,
      init: new Date('2019-01-01'),
      end: new Date('2020-01-01'),
    });
    // end init context

    const discount = {
      executedId: 1,
      date: new Date('2019-02-15'),
      description: 'descripcion',
      discountType: 'percentage',
      discount: 10,
      tpvCode: 'tpvCode',
    };

    const cons = {
      monthsPeriod: [
        { init: '2019-01-01', end: '2019-01-30', daysInMonth: 30 },
        { init: '2019-02-01', end: '2019-02-30', daysInMonth: 30 },
        { init: '2019-03-01', end: '2019-03-30', daysInMonth: 30 },
      ],
      contractBlocks: [
        { init: '2019-01-01', end: '2019-01-30', daysInBlock: 30, quote: 200 },
        { init: '2019-02-01', end: '2019-02-30', daysInBlock: 30, quote: 200 },
        { init: '2019-03-01', end: '2019-03-30', daysInBlock: 30, quote: 200 },
      ],
    };

    const result = await generateDiscountLines(discount, cons);

    expect(result?.iLines).toEqual([
      {
        code: 'tpvCode',
        productKey: 'manualDiscount',
        concpet: '(descripcion) ',
        quantity: -244,
      },
      {
        code: 'tpvCode',
        productKey: 'manualDiscount',
        concpet: '(descripcion) ',
        quantity: -244,
      },
      {
        code: 'tpvCode',
        productKey: 'manualDiscount',
        concpet: '(descripcion) ',
        quantity: -244,
      },
    ]);

    expect(result?.executed).toMatchObject({
      id: 1,
      targetContractId: 1,
    });
  });
});

describe('GfDiscountsService.getTodayDiscountsToApply tests', () => {
  it('should work', async () => {
    const contract = {
      id: 3,
      state: 'state',
      dateDeactivation: moment('2019-01-01'),
    };

    const period = {
      initDate: moment('2019-01-01'),
      endDate: moment('2019-01-31'),
    };

    await GfDiscountsScheduled.create({
      id: 2,
      uid: 90,
      type: 'discount',
      state: 'pending',
      contractId: contract.id,
      permanent: 0,
      date: new Date('2019-01-15'),
    });

    await GfDiscountsScheduled.create({
      id: 3,
      uid: 90,
      type: 'discount',
      state: 'pending',
      contractId: contract.id,
      permanent: 0,
      date: new Date('2019-02-15'),
    });

    const result = await getTodayDiscountsToApply(contract, period);
    expect(result?.length).toBe(1);
    expect(result[0].id).toBe(2);
  });
});

describe.skip('GfDiscountsService.checkUpToDate tests', () => {
  it('it should work', async () => {
    const clientId = 10;

    const contract = {
      id: 5,
      type: 'active',
      dateDeactivation: moment('2019-01-01'),
      clientId,
    };

    const period = {
      initDate: moment('2019-01-01'),
      endDate: moment('2019-01-31'),
    };

    await GfContractHolderChange.create({
      id: 1,
      contractId: contract.id,
      state: 'done',
      changeDate: moment('2019-01-01'),
      fromClientId: 5,
      toClientId: clientId,
    });

    const result = await checkUpToDate(contract, period, clientId);
    expect(result).toEqual({ success: true, toReview: false });
  });

  it('it should return with toReview:true', async () => {
    const clientId = 10;

    const contract = {
      id: 5,
      type: 'active',
      dateDeactivation: moment('2019-01-01'),
      clientId,
    };

    const period = {
      initDate: moment('2019-01-01'),
      endDate: moment('2019-01-31'),
    };

    await GfDiscountsScheduled.create({
      id: 3,
      uid: 90,
      type: 'discount',
      state: 'applied',
      contractId: contract.id,
      permanent: 0,
      date: new Date('2019-01-15'),
    });

    await GfContractHolderChange.create({
      id: 1,
      contractId: contract.id,
      state: 'done',
      changeDate: moment('2019-01-01'),
      fromClientId: 5,
      toClientId: clientId,
    });

    const result = await checkUpToDate(contract, period, clientId);
    expect(result).toEqual({ success: true, toReview: true });
  });
});

describe('GfDiscountsService.setApplied', () => {
  it('should work', async () => {
    const discount = {
      id: 18,
      executedId: 1,
      date: new Date('2019-02-15'),
      description: 'descripcion',
      discountType: 'percentage',
      discount: 10,
      tpvCode: 'tpvCode',
      contractId: 20,
      permanent: 1,
      matrixId: 5,
      get() {
        const { get, update, ...rest } = this;
        return rest;
      },
      async update() {
        console.log('discount update');
      },
    };

    await GfContract.create({
      id: discount.contractId,
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

    const result = await setApplied(discount);
    expect(result?.success).toBe(true);
    expect(result.scheduled?.executedId).toBe(1);
    expect(result.nextScheduled?.permanentParentId).toBe(18);
  });
});
