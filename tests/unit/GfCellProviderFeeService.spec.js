'use strict';

require('../init-tests');
const {
  createGfCellProviderFee,
  getGfCellProviderFee,
  getGfCellProviderFeeId,
  updateGfCellProviderFee,
  deleteGfCellProviderFee,
} = require('src/api/service/intranet/GfCellProviderFeesService');
const {
  GfCellProviderFeeBonus,
  InvoiceProduct,
  GfCellProviderFee,
  GfCellProviderFeeBonusXref,
} = require('@models').intranet;

beforeAll(async () => {
  await GfCellProviderFeeBonus.destroy({
    where: {},
    truncate: true,
  });

  await InvoiceProduct.destroy({
    where: {},
    truncate: true,
  });

  await GfCellProviderFee.destroy({
    where: {},
    truncate: true,
  });

  await GfCellProviderFeeBonusXref.destroy({
    where: {},
    truncate: true,
  });
});

describe('GfCellProviderFeeService.createGfCellProviderFee', () => {
  it('should work', async () => {
    // init context
    const body = {
      uid: 90,
      name: 'test',
      providerName: 'internal test',
      providerId: 1,
      providerFeeId: 1,
      status: 1,
    };

    const result = await createGfCellProviderFee(body);
    expect(result.code).toBe(201);
    expect(typeof result.payload.data).toBe('object');
  });
});

describe('GfCellProviderFeeService.getGfCellProviderFee', () => {
  it('should work', async () => {
    const result = await getGfCellProviderFee({});
    expect(result.code).toBe(200);
  });
});

describe('GfCellProviderFeeService.getGfCellProviderFeeId', () => {
  it('should work', async () => {
    const result = await getGfCellProviderFeeId(1);
    expect(result.code).toBe(200);
  });
});

describe('GfCellProviderFeeService.updateGfCellProviderFee', () => {
  it('should work', async () => {
    // init context
    const body = {
      uid: 90,
      name: 'test',
      providerName: 'internal test',
      providerId: 1,
      providerFeeId: 1,
      status: 1,
    };

    const result = await updateGfCellProviderFee(1, body);
    expect(result.code).toBe(200);
    expect(typeof result.payload.data).toBe('object');
  });
});

describe('GfCellProviderFeeService.deleteGfCellProviderFee', () => {
  it('should work', async () => {
    const result = await deleteGfCellProviderFee(1);
    expect(result.code).toBe(200);
  });
});
