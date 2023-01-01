'use strict';

const { ASSIGNABLE } = require('@api/constants/statuses');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, { DataTypes }) => {
    await queryInterface.createTable('operador_landlines', {
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
        allowNull: true,
        type: DataTypes.STRING,
      },
      operador_fiscal_id: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      owner: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      gf_contract_id: {
        allowNull: true,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ASSIGNABLE.ASSIGNABLE,
      },
      portability: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('operador_landlines');
  },
};
