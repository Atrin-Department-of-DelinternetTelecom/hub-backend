'use strict';

const { Sequelize } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, { DataTypes }) => {
    await queryInterface.createTable('technician_coordinates', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      technician_task_id: {
        allowNull: false,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      technician_step_id: {
        allowNull: true,
        type: DataTypes.INTEGER.UNSIGNED,
        defaultValue: null,
      },
      state: {
        type: Sequelize.ENUM(
          'pending',
          'in_progress',
          'done',
          'cancelled',
          'error',
        ),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'task state',
      },
      lat: {
        allowNull: false,
        type: DataTypes.DECIMAL(10, 8),
      },
      lng: {
        allowNull: false,
        type: DataTypes.DECIMAL(11, 8),
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('technician_coordinates');
  },
};
