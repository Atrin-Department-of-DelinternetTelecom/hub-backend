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

      values.push({
        disabled_notifiers: faker.address.zipCode(),
        fallback_sms_count: '3', //
        msg_period: 2,
        msgs_per_period: 2,
        msg_hour: faker.date.recent(),
        uid: 90,
        user_id: creator.id,
        status: 1,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('unpaid_settings', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('unpaid_settings', null, {});
  },
};
