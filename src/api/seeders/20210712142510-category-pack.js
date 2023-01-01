'use strict';

const SEquelize = require('sequelize');
const { User, Category, Pack } = require('@models').system;
const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 20; index++) {
      const creator = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const category = await Category.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const pack = await Pack.findOne({ order: SEquelize.literal('RAND()') });
      values.push({
        category_id: category.id,
        pack_id: pack.id,
        type: 'product',
        creator_id: creator.id,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('web_categories_packs', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('web_categories_packs', null, {});
  },
};
