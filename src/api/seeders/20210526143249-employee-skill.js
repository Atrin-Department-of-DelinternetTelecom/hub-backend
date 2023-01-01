'use strict';

const SEquelize = require('sequelize');
const { User, Skill } = require('@models').system;
const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 10; index++) {
      const employee = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      const skill = await Skill.findOne({ order: SEquelize.literal('RAND()') });
      values.push({
        employee_id: employee.id,
        skill_id: skill.id,
        details: faker.lorem.text(),
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('hrms_employee_skill', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('hrms_employee_skill', null, {});
  },
};
