'use strict';

const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 10; index++) {
      values.push({
        name: faker.internet.userName(),
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('hrms_employment_status', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('hrms_employment_status', null, {});
  },
};
