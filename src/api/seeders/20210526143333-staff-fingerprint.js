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
        fingerprint_template: faker.lorem.text(),
        hardware_name: faker.lorem.word(),
        finger: faker.datatype.number(),
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('hrms_anviz_staff_fingerprint', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('hrms_anviz_staff_fingerprint', null, {});
  },
};
