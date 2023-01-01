'use strict';

const SEquelize = require('sequelize');
const { User } = require('@models').system;
const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 10; index++) {
      const user = await User.findOne({ order: SEquelize.literal('RAND()') });
      values.push({
        uuid: faker.datatype.uuid(),
        device_id: Math.floor(Math.random() * (200 - 100 + 1)) + 100,
        ip: faker.internet.ip(),
        location: '123.2221 12.4353',
        name: faker.internet.userName(),
        port: 2338,
        timeout: 12,
        username: faker.internet.userName(),
        password: faker.internet.password(),
        creator_id: user.id,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    return queryInterface.bulkInsert('hrms_anviz', values, {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('hrms_anviz', null, {});
  },
};
