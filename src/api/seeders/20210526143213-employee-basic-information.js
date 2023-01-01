'use strict';

const SEquelize = require('sequelize');
const { User, Job, Department, EmploymentStatus } = require('@models').system;
const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 10; index++) {
      const employee = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const employmentStatus = await EmploymentStatus.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const department = await Department.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const job = await Job.findOne({ order: SEquelize.literal('RAND()') });
      values.push({
        employee_id: employee.id,
        employee_number: faker.finance.creditCardNumber(),
        birth_date: faker.date.past(),
        gender: 'male',
        marital_status: 'other',
        immigration_status: 'citizen',
        SSN_NRIC: faker.internet.mac(),
        NIC: faker.internet.mac(),
        other_id: faker.internet.mac(),
        driving_license_no: faker.finance.creditCardNumber(),
        employment_status_id: employmentStatus.id,
        department_id: department.id,
        job_id: job.id,
        pay_grade: 'manager',
        joined_date: faker.date.future(),
        confirmation_date: faker.date.future(),
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert(
      'hrms_employee_basic_information',
      values,
      {},
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(
      'hrms_employee_basic_information',
      null,
      {},
    );
  },
};
