'use strict';

const SEquelize = require('sequelize');
const { User } = require('@models').system;
const faker = require('faker');
const values = [];

const LANGUAGES = ['en', 'ca', 'es'];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 10; index++) {
      const employee = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      values.push({
        employee_id: employee.id,
        language: LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)],
        reading: 'native or bilingual proficiency',
        listening: 'native or bilingual proficiency',
        speaking: 'native or bilingual proficiency',
        writing: 'native or bilingual proficiency',
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('hrms_employee_language', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('hrms_employee_language', null, {});
  },
};
