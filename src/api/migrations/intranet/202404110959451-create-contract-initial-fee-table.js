'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, { DataTypes }) => {
    await queryInterface.createTable('contract_initial_fee', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      gf_contract_id: {
        allowNull: false,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      initial_fee_id: {
        allowNull: false,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      start_date: {
        allowNull: true,
        defaultValue: null,
        type: DataTypes.DATE,
      },
      end_date: {
        allowNull: true,
        defaultValue: null,
        type: DataTypes.DATE,
      },
      installments: {
        allowNull: true,
        defaultValue: null,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      discount: {
        allowNull: true,
        defaultValue: null,
        type: DataTypes.DECIMAL(10, 3),
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('contract_initial_fee');
  },
};
