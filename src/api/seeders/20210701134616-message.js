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
      const sender = await User.findOne({ order: SEquelize.literal('RAND()') });
      const reciver = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      values.push({
        text: faker.lorem.sentence(),
        from_user_id: sender.id,
        to_user_id: reciver.id,
        filter: 13,
        read: false,
        creator_id: creator.id,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('hrms_message', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('hrms_message', null, {});
  },
};
