'use strict';

require('../../init-tests');
const { GfClient } = require('@models').intranet;
const { GfContract } = require('@models').intranet;

beforeAll(async () => {
  await GfClient.destroy({
    truncate: true,
  });
  await GfContract.destroy({
    truncate: true,
  });
});

describe('GfClient.findByContractId', () => {
  it('can find client by contract id', async () => {
    const client = await GfClient.create({
      uid: 90,
      name: 'test',
      status: 1,
    });
    const contract = await GfContract.create({
      uid: 90,
      name: 'test',
      clientId: client.id,
      status: 1,
    });

    expect(client).not.toBeNull();
    expect(contract).not.toBeNull();

    const foundByContractId = await GfClient.findByContractId(contract.id);
    expect(foundByContractId.id).toBe(client.id);
  });
});
