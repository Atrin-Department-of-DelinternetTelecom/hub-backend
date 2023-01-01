'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('acl_settings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      key: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING,
      },
      value: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      app_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      metadata: {
        type: Sequelize.TEXT,
        defaultValue: '{}',
      },
      creator_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('acl_settings');
  },
};
