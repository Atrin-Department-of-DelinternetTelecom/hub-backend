'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, { DataTypes }) => {
    await queryInterface.createTable('custom_action_events', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      type_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      event_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      user_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      resource_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      resource_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      changes: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
      },
      payload: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
      },
      original: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
      },
      root_join_data: {
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
    await queryInterface.dropTable('custom_action_events');
  },
};
