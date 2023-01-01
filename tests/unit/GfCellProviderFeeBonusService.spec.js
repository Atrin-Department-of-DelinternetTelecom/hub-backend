'use strict';

require('../init-tests');
const {
  createGfCellProviderFeeBonus,
  getGfCellProviderFeeBonus,
  getGfCellProviderFeeBonusId,
  updateGfCellProviderFeeBonus,
  deleteGfCellProviderFeeBonus,
} = require('src/api/service/intranet/GfCellProviderFeeBonusService');
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

describe('GfCellProviderFeeBonusService.createGfCellProviderFeeBonus', () => {
  it('should work', async () => {
    // init context
    const body = {
      uid: 90,
      name: 'test',
      providerBonusId: 1,
      status: 1,
    };

    const result = await createGfCellProviderFeeBonus(body);
    expect(result.code).toBe(201);
    expect(typeof result.payload.data).toBe('object');
  });
});

describe('GfCellProviderFeeBonusService.getGfCellProviderFeeBonus', () => {
  it('should work', async () => {
    const result = await getGfCellProviderFeeBonus({});
    expect(result.code).toBe(200);
  });
});

describe('GfCellProviderFeeBonusService.getGfCellProviderFeeBonusId', () => {
  it('should work', async () => {
    const result = await getGfCellProviderFeeBonusId(1);
    expect(result.code).toBe(200);
  });
});

describe('GfCellProviderFeeBonusService.updateGfCellProviderFeeBonus', () => {
  it('should work', async () => {
    // init context
    const body = {
      uid: 90,
      name: 'test',
      providerBonusId: 1,
      status: 1,
    };

    const result = await updateGfCellProviderFeeBonus(1, body);
    expect(result.code).toBe(200);
    expect(typeof result.payload.data).toBe('object');
  });
});

describe('GfCellProviderFeeBonusService.deleteGfCellProviderFeeBonus', () => {
  it('should work', async () => {
    const result = await deleteGfCellProviderFeeBonus(1);
    expect(result.code).toBe(200);
  });
});
