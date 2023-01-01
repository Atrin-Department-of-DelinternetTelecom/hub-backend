'use strict';

const SEquelize = require('sequelize');
const { User, Category, Pack } = require('@models').system;
const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const packs = await Pack.findAll();
    for (const pack of packs) {
      const creator = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      values.push({
        alias: faker.lorem.word(),
        pack_id: pack.id,
        weight: 0,
        published: 0,
        default: 0,
        products_hide: 0,
        features_hide: 0,
        class_list: faker.lorem.word(),
        metadata: '{}',
        creator_id: creator.id,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }

    await queryInterface.bulkInsert('web_definitions', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('web_definitions', null, {});
  },
};
