'use strict';

const SEquelize = require('sequelize');
const { User, File, Vehicle } = require('@models').system;
const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 20; index++) {
      const driver = await User.findOne({ order: SEquelize.literal('RAND()') });
      const creator = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const vehicle = await Vehicle.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const file1 = await File.findOne({ order: SEquelize.literal('RAND()') });
      const file2 = await File.findOne({ order: SEquelize.literal('RAND()') });
      values.push({
        driver_id: driver.id,
        vehicle_id: vehicle.id,
        creator_id: creator.id,
        end_date: faker.date.future(),
        start_date: faker.date.past(),
        km_image_start: file1.id,
        km_image_end: file2.id,
        start_km_num: faker.datatype.float(),
        end_km_num: faker.datatype.float(),
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('hrms_vehicle_driver', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('hrms_vehicle_driver', null, {});
  },
};
