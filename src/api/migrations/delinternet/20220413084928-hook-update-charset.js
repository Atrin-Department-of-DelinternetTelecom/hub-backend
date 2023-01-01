'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize
      .query(`ALTER TABLE ${queryInterface.sequelize.config.database}.global_hooks 
    DEFAULT CHARSET=utf8mb4;
    `);
    await queryInterface.sequelize.query(
      `ALTER TABLE ${queryInterface.sequelize.config.database}.global_hooks MODIFY COLUMN template text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;`,
    );
    await queryInterface.sequelize.query(
      `REPAIR TABLE ${queryInterface.sequelize.config.database}.global_hooks;`,
    );
    await queryInterface.sequelize.query(
      `OPTIMIZE TABLE ${queryInterface.sequelize.config.database}.global_hooks;`,
    );
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
