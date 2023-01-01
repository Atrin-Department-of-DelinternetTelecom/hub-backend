'use strict';

const SEquelize = require('sequelize');
const { User } = require('@models').system;
const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 10; index++) {
      const employee = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      values.push({
        employee_id: employee.id,
        name: faker.lorem.word(),
        home_phone: faker.phone.phoneNumber(),
        work_phone: faker.phone.phoneNumber(),
        mobile_phone: faker.phone.phoneNumber(),
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('hrms_employee_contact', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('hrms_employee_contact', null, {});
  },
};
