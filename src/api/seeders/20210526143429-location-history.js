'use strict';

const SEquelize = require('sequelize');
const { User } = require('@models').system;
const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 10; index++) {
      const user = await User.findOne({ order: SEquelize.literal('RAND()') });
      const owner = await User.findOne({ order: SEquelize.literal('RAND()') });
      const route = {
        type: 'LineString',
        coordinates: [
          [
            [100.0, 0.0],
            [101.0, 0.0],
            [101.0, 1.0],
            [100.0, 1.0],
            [100.0, 0.0],
          ],
        ],
      };
      values.push({
        routeable_id: owner.id,
        routeable_type: 'user',
        route: JSON.stringify(route),
        creator_id: user.id,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    queryInterface.bulkInsert('hrms_location_history', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('hrms_location_history', null, {});
  },
};
