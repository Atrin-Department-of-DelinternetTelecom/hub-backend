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
      const owner = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      values.push({
        owner_id: owner.id,
        concept: 'newDoc',
        app: 'hrms',
        subject: faker.lorem.sentence(),
        text: faker.lorem.sentence(),
        read: false,
        creator_id: creator.id,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('global_notifications', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('global_notifications', null, {});
  },
};
