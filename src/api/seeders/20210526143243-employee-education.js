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
        institute: faker.lorem.word(),
        qualification: 'bachelors digree',
        start_date: faker.date.past(),
        proof_doc_file_id: 1,
        completed_on: faker.date.future(),
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('hrms_employee_education', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('hrms_employee_education', null, {});
  },
};
