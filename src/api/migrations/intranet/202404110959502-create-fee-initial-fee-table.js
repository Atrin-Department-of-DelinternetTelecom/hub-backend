'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, { DataTypes }) => {
    await queryInterface.createTable('fee_initial_fee', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      gf_fee_id: {
        allowNull: false,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      initial_fee_id: {
        allowNull: false,
        type: DataTypes.INTEGER.UNSIGNED,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('fee_initial_fee');
  },
};
