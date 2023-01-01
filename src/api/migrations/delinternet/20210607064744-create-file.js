'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('hrms_file', {
      id: {
        autoIncrement: true,
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      file: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      fileable_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fileable_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      is_valid: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: 1,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('hrms_file');
  },
};
