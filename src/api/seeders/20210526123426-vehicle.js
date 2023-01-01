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
        name: faker.internet.userName(),
        info: faker.lorem.text(),
        plate: faker.lorem.word(),
        number: faker.finance.creditCardNumber(),
        creator_id: user.id,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('hrms_vehicle', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('hrms_vehicle', null, {});
  },
};
