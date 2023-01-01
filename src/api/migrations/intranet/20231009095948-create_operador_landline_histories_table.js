'use strict';

const { ASSIGNABLE_HISTORY } = require('@api/constants/statuses');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, { DataTypes }) => {
    await queryInterface.createTable('operador_landline_histories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      action_type: {
        allowNull: false,
        type: DataTypes.STRING,
        default: ASSIGNABLE_HISTORY.ASSIGNED,
      },
      operador_landline_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      gf_contract_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      operator_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updated_at: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('operador_landline_histories');
  },
};
