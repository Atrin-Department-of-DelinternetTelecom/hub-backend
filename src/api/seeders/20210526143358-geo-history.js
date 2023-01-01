'use strict';

const SEquelize = require('sequelize');
const { User, Geofence } = require('@models').system;
const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 10; index++) {
      const user = await User.findOne({ order: SEquelize.literal('RAND()') });
      const geofence = await Geofence.findOne({
        order: SEquelize.literal('RAND()'),
      });
      values.push({
        geofence_id: geofence.id,
        leave_date: faker.date.future(),
        creator_id: user.id,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    queryInterface.bulkInsert('hrms_geohistory', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('hrms_geohistory', null, {});
  },
};
