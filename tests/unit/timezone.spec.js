'use strict';

require('../init-tests');
const {
  system: { AclRole },
} = require('@models');
const { initDb } = require('../test-utils');
const moment = require('moment');

describe('timezone related tests', () => {
  it('default createdAt is correct', async () => {
    initDb({
      AclRole: [],
    });

    const now = Date.now();
    await AclRole.create({
      id: 1,
      name: 'test',
      creator_id: 1,
    });

    const entity = await AclRole.findByPk(1);
    const diff = Math.abs(entity.createdAt.getTime() - now);

    expect(diff).toBeLessThan(60 * 1000);
  });

  it('insert createdAt is correct', async () => {
    initDb({
      AclRole: [],
    });

    await AclRole.create({
      id: 1,
      name: 'test',
      creator_id: 1,
      createdAt: new Date('2022-09-22T07:12:36.000Z'),
    });

    const entity = await AclRole.findByPk(1);

    expect(entity).toMatchObject({
      createdAt: new Date('2022-09-22T07:12:36.000Z'),
    });
  });

  it('insert createdAt is correct via moment', async () => {
    initDb({
      AclRole: [],
    });

    const now = moment('2022-01-01 14:30:00');
    await AclRole.create({
      id: 1,
      name: 'test',
      creator_id: 1,
      createdAt: now,
    });

    const entity = await AclRole.findByPk(1);
    const diff = Math.abs(entity.createdAt.getTime() - now.toDate().getTime());

    expect(diff).toBeLessThan(60 * 1000);
  });

  it('insert createdAt is correct via formatted string', async () => {
    initDb({
      AclRole: [],
    });

    const now = moment('2022-01-01 12:30:00');
    await AclRole.create({
      id: 1,
      name: 'test',
      creator_id: 1,
      createdAt: now.format('YYYY-MM-DD HH:mm:ss'),
    });

    const entity = await AclRole.findByPk(1);
    const diff = Math.abs(entity.createdAt.getTime() - now.toDate().getTime());

    expect(diff).toBeLessThan(60 * 1000);
  });
});
