'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('global_backups', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      type: {
        allowNull: false,
        type: Sequelize.ENUM('complete', 'custom', 'imported'),
      },
      state: {
        allowNull: false,
        type: Sequelize.ENUM('pending', 'success', 'error'),
      },
      error: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      file_name: {
        allowNull: false,
        type: Sequelize.STRING(255),
      },
      creator_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      size: {
        allowNull: false,
        type: Sequelize.BIGINT,
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
    await queryInterface.dropTable('global_backups');
  },
};
