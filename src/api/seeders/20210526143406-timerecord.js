'use strict';

const SEquelize = require('sequelize');
const { User, Anviz } = require('@models').system;
const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 20; index++) {
      const user = await User.findOne({ order: SEquelize.literal('RAND()') });
      const creator = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const anviz = await Anviz.findOne({ order: SEquelize.literal('RAND()') });
      values.push({
        user_id: user.id,
        anviz_id: anviz.id,
        creator_id: creator.id,
        enter: faker.date.future(),
        exit: faker.date.past(),
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('hrms_timerecords', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('hrms_timerecords', null, {});
  },
};
