'use strict';

const SEquelize = require('sequelize');
const { User } = require('@models').system;
const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 20; index++) {
      const creator = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const userProcessed = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });

      values.push({
        name: faker.lorem.word(),
        email: faker.internet.email(),
        phone_number: faker.phone.phoneNumber(),
        status: 'pending',
        processed_by_user_id: userProcessed.id,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('web_call_me', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('web_call_me', null, {});
  },
};
