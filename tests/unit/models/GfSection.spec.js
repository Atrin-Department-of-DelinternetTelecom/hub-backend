'use strict';

require('../../init-tests');
const { GfSection } = require('@models').intranet;

beforeAll(async () => {
  await GfSection.destroy({
    truncate: true,
  });
});

describe('GfSection.findByCode', () => {
  it('can find section by code', async () => {
    // init context
    const code = 'TEST';
    const body = {
      uid: 90,
      name: 'test',
      code: code,
      status: 1,
    };

    const result = await GfSection.create(body);
    expect(result).not.toBeNull();

    const findByCode = await GfSection.findByCode(code);
    expect(findByCode.id).toBe(result.id);
  });
});
