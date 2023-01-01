'use strict';

const SEquelize = require('sequelize');
const { User, File } = require('@models').system;
const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 20; index++) {
      const owner = await User.findOne({ order: SEquelize.literal('RAND()') });
      const signature = await File.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const sign_doc = await File.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const creator = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      values.push({
        owner_id: owner.id,
        from: faker.date.past(),
        to: faker.date.future(),
        state: 'pending',
        explain: faker.lorem.text(),
        signature_id: signature.id,
        sign_doc_file_id: sign_doc.id,
        state_by_owner: true,
        creator_id: creator.id,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('hrms_vacation', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('hrms_vacation', null, {});
  },
};
