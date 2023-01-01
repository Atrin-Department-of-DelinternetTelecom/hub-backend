'use strict';

const SEquelize = require('sequelize');
const { User, File, Folder, AdminDocs } = require('@models').system;
const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 20; index++) {
      const creator = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const file = await File.findOne({ order: SEquelize.literal('RAND()') });
      const folder = await Folder.findOne({
        order: SEquelize.literal('RAND()'),
      });
      values.push({
        name: faker.internet.userName(),
        file_id: file.id,
        folder_id: folder.id,
        creator_id: creator.id,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('hrms_admin_docs', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('hrms_admin_docs', null, {});
  },
};
