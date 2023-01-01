'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE global_users
      ADD COLUMN name VARCHAR(255) GENERATED ALWAYS AS (CONCAT(first_name, ' ', last_name)) VIRTUAL;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('global_users', 'name');
  },
};
