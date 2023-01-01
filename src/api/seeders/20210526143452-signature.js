'use strict';

const SEquelize = require('sequelize');
const { User, File } = require('@models').system;
const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 20; index++) {
      const owner = await User.findOne({ order: SEquelize.literal('RAND()') });
      const creator = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const image = await File.findOne({ order: SEquelize.literal('RAND()') });
      values.push({
        owner_id: owner.id,
        image_id: image.id,
        creator_id: creator.id,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('hrms_signature', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('hrms_signature', null, {});
  },
};
