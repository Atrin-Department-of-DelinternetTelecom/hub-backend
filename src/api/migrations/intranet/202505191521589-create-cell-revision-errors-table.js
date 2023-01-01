'use strict';

const { Sequelize } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, { DataTypes }) => {
    await queryInterface.createTable('cell_revision_errors', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      number: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      fiscal_id: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      fee: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      group: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      provider: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      error: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('cell_revision_errors');
  },
};
