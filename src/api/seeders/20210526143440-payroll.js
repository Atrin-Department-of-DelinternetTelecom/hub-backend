'use strict';

const SEquelize = require('sequelize');
const { User, File } = require('@models').system;
const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 20; index++) {
      const employee = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const employee_signature = await File.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const company_signature = await File.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const payroll_image = await File.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const payment = await File.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const creator = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      values.push({
        employee_id: employee.id,
        salary: faker.datatype.float(),
        creator_id: creator.id,
        status: 'pending',
        details: faker.lorem.text(),
        date: new Date(),
        employee_signature_id: employee_signature.id,
        pdf_image_id: payroll_image.id,
        company_signature_id: company_signature.id,
        payment_id: payment.id,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('hrms_payroll', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('hrms_payroll', null, {});
  },
};
