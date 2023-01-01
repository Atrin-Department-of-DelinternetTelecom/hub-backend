'use strict';

require('../init-tests');
const { initDb } = require('../test-utils');
const { UserContract } = require('@models').allModels;
const _ = require('lodash');

jest.setTimeout(100000000);

const {
  postUserContract,
  updateUserContract,
} = require('../../src/api/service/hrms/UserContractService');
const { Op } = require('sequelize');
const { getConnectionFor } = require('@lib/sequelize');

const sampleResponse = {
  id: expect.any(Number),
  owner_id: 3,
  description: 'first decsription update for test',
  is_active: true,
  createdAt: expect.any(Date),
  updatedAt: expect.any(Date),
  contract_id: 1,
  gfContract: {
    id: 1,
  },
};

beforeAll(async () => {
  const result = await getConnectionFor('system').query(
    'SET GLOBAL FOREIGN_KEY_CHECKS=0',
  );
  console.log(result);
});

const dataUpdater = async (inputDataForUpdate) => {
  const updateData = (
    await updateUserContract(2, inputDataForUpdate, 1)
  ).unwrap();
  return updateData;
};

const checkTheActiveStatusOfTheRows = async (inputDataForUpdate) => {
  const updatedDataId = await dataUpdater(inputDataForUpdate);
  const prevRow = await UserContract.findAll({
    where: {
      contract_id: 1,
      is_active: true,
      id: { [Op.ne]: updatedDataId.id },
    },
  });
  expect(prevRow).toEqual([]);
  return true;
};

describe('userContract test', () => {
  it('should post a user contract', async () => {
    await initDb({
      UserContract: [],
      GfContract: {
        id: 1,
        uid: 90,
        invoiceProfileId: 1,
        payday: 0,
        state: 'active',
      },
    });

    const postData = (
      await postUserContract(
        {
          id: 2,
          creator_id: 1,
          owner_id: '1',
          contract_id: 1,
          is_active: true,
          description: 'insertion test',
        },
        1,
      )
    ).unwrap();

    expect(postData).toMatchObject({
      ...sampleResponse,
      owner_id: '1',
      is_active: true,
      description: 'insertion test',
      history: [
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'insertion test',
          id: expect.any(Number),
          is_active: true,
          owner: {},
          owner_id: '1',
          updatedAt: expect.any(Date),
        },
      ],
    });
  });

  it('should update prev row is_active and create a new row', async () => {
    const inputDataForUpdate = {
      owner_id: '2',
      description: 'first decsription update for test',
    };

    const updatedData = await dataUpdater(inputDataForUpdate);
    expect(updatedData).toMatchObject({
      ...sampleResponse,
      owner_id: '2',
      is_active: true,
      description: 'first decsription update for test',
      history: [
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          owner: {},
          description: 'insertion test',
          id: expect.any(Number),
          is_active: false,
          owner_id: '1',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          owner: {},
          deletedAt: null,
          description: 'first decsription update for test',
          id: expect.any(Number),
          is_active: true,
          owner_id: '2',
          updatedAt: expect.any(Date),
        },
      ],
    });

    await checkTheActiveStatusOfTheRows(inputDataForUpdate);
  });

  it('should update prev row is_active and create new row', async () => {
    const inputDataForUpdate = {
      owner_id: '3',
      description: 'first decsription update for test',
    };

    const updatedData = await dataUpdater(inputDataForUpdate);
    expect(updatedData).toMatchObject({
      ...sampleResponse,
      owner_id: '3',
      description: 'first decsription update for test',
      is_active: true,
      history: [
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'insertion test',
          owner: {},
          id: expect.any(Number),
          is_active: false,
          owner_id: '1',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          owner: {},
          deletedAt: null,
          description: 'first decsription update for test',
          id: expect.any(Number),
          is_active: false,
          owner_id: '2',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          owner: {},
          deletedAt: null,
          description: 'first decsription update for test',
          id: expect.any(Number),
          is_active: true,
          owner_id: '3',
          updatedAt: expect.any(Date),
        },
      ],
    });
    await checkTheActiveStatusOfTheRows(inputDataForUpdate);
  });

  it('should update prev row is_active and create new row', async () => {
    const inputDataForUpdate = {
      owner_id: '2',
      description: 'first decsription update for test',
    };

    const updatedData = await dataUpdater(inputDataForUpdate);
    expect(updatedData).toMatchObject({
      ...sampleResponse,
      owner_id: '2',
      description: 'first decsription update for test',
      is_active: true,
      history: [
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'insertion test',
          id: expect.any(Number),
          is_active: false,
          owner_id: '1',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'first decsription update for test',
          id: expect.any(Number),
          is_active: false,
          owner_id: '2',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'first decsription update for test',
          id: expect.any(Number),
          is_active: false,
          owner_id: '3',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'first decsription update for test',
          id: expect.any(Number),
          is_active: true,
          owner_id: '2',
          updatedAt: expect.any(Date),
        },
      ],
    });
    await checkTheActiveStatusOfTheRows(inputDataForUpdate);
  });

  it('should update the description of the last created row', async () => {
    const inputDataForUpdate = {
      owner_id: '2',
      description: 'new test',
    };
    const updatedData = await dataUpdater(inputDataForUpdate);
    expect(updatedData).toMatchObject({
      ...sampleResponse,
      owner_id: '2',
      description: 'new test',
      is_active: true,
      history: [
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'insertion test',
          id: expect.any(Number),
          is_active: false,
          owner_id: '1',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'first decsription update for test',
          id: expect.any(Number),
          is_active: false,
          owner_id: '2',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'first decsription update for test',
          id: expect.any(Number),
          is_active: false,
          owner_id: '3',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'new test',
          id: expect.any(Number),
          is_active: true,
          owner_id: '2',
          updatedAt: expect.any(Date),
        },
      ],
    });
    await checkTheActiveStatusOfTheRows(inputDataForUpdate);
  });

  it('should update prev row is_active and create new row', async () => {
    const inputDataForUpdate = {
      owner_id: '2',
    };

    const updatedData = await dataUpdater(inputDataForUpdate);
    expect(updatedData).toMatchObject({
      ...sampleResponse,
      id: expect.any(Number),
      owner_id: '2',
      is_active: true,
      description: null,
      history: [
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'insertion test',
          id: expect.any(Number),
          is_active: false,
          owner_id: '1',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'first decsription update for test',
          id: expect.any(Number),
          is_active: false,
          owner_id: '2',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'first decsription update for test',
          id: expect.any(Number),
          is_active: false,
          owner_id: '3',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: null,
          id: expect.any(Number),
          is_active: true,
          owner_id: '2',
          updatedAt: expect.any(Date),
        },
      ],
    });
    await checkTheActiveStatusOfTheRows(inputDataForUpdate);
  });

  it('should update prev row is_active and create new row with null owner and description', async () => {
    const inputDataForUpdate = {};
    const updatedData = await dataUpdater(inputDataForUpdate);
    expect(updatedData).toMatchObject({
      ...sampleResponse,
      owner_id: null,
      description: null,
      is_active: true,
      history: [
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'insertion test',
          id: expect.any(Number),
          is_active: false,
          owner_id: '1',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'first decsription update for test',
          id: expect.any(Number),
          is_active: false,
          owner_id: '2',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'first decsription update for test',
          id: expect.any(Number),
          is_active: false,
          owner_id: '3',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: null,
          id: expect.any(Number),
          is_active: false,
          owner_id: '2',
          updatedAt: expect.any(Date),
        },
      ],
    });
    await checkTheActiveStatusOfTheRows(inputDataForUpdate);
  });

  it('should update prev row is_active and create a new row', async () => {
    const inputDataForUpdate = {
      owner_id: '1',
    };
    const updatedData = await dataUpdater(inputDataForUpdate);
    expect(updatedData).toMatchObject({
      ...sampleResponse,
      owner_id: '1',
      description: null,
      is_active: true,
      history: [
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'insertion test',
          id: expect.any(Number),
          is_active: false,
          owner_id: '1',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'first decsription update for test',
          id: expect.any(Number),
          is_active: false,
          owner_id: '2',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'first decsription update for test',
          id: expect.any(Number),
          is_active: false,
          owner_id: '3',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: null,
          id: expect.any(Number),
          is_active: false,
          owner_id: '2',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: null,
          id: expect.any(Number),
          is_active: true,
          owner_id: '1',
          updatedAt: expect.any(Date),
        },
      ],
    });
    await checkTheActiveStatusOfTheRows(inputDataForUpdate);
  });

  it('should update prev row description', async () => {
    const inputDataForUpdate = {
      owner_id: '1',
      description: 'another test description',
    };
    const updatedData = await dataUpdater(inputDataForUpdate);
    expect(updatedData).toMatchObject({
      owner_id: '1',
      description: 'another test description',
      is_active: true,
      history: [
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'insertion test',
          id: expect.any(Number),
          is_active: false,
          owner_id: '1',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'first decsription update for test',
          id: expect.any(Number),
          is_active: false,
          owner_id: '2',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'first decsription update for test',
          id: expect.any(Number),
          is_active: false,
          owner_id: '3',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: null,
          id: expect.any(Number),
          is_active: false,
          owner_id: '2',
          updatedAt: expect.any(Date),
        },
        {
          contract_id: 1,
          createdAt: expect.any(Date),
          creator_id: 1,
          deletedAt: null,
          description: 'another test description',
          id: expect.any(Number),
          is_active: true,
          owner_id: '1',
          updatedAt: expect.any(Date),
        },
      ],
    });
    await checkTheActiveStatusOfTheRows(inputDataForUpdate);
  });
});
