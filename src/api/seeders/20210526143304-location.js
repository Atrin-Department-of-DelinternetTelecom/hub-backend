'use strict';

const SEquelize = require('sequelize');
const { User } = require('@models').system;
const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 10; index++) {
      const owner = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const creator = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const point = {
        type: 'Point',
        coordinate: [100.0, 0.0],
      };
      values.push({
        locationable_id: owner.id,
        locationable_type: 'user',
        location: JSON.stringify(point),
        creator_id: creator.id,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('hrms_anviz_location', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('hrms_anviz_location', null, {});
  },
};
