'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, { DataTypes }) => {
    await queryInterface.createTable('custom_action_event_types', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      keys: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      resource_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      enable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      root_join_selector: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('custom_action_event_types');
  },
};
