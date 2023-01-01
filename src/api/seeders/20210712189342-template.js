'use strict';

const SEquelize = require('sequelize');
const { User, File } = require('@models').system;
const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 20; index++) {
      const creator = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const file = await File.findOne({
        order: SEquelize.literal('RAND()'),
      });
      values.push({
        name: faker.lorem.word(),
        template_file_id: file.id,
        creator_id: creator.id,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('global_template', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('global_template', null, {});
  },
};
