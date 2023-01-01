'use strict';

const { Sequelize } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, { DataTypes }) => {
    await queryInterface.createTable('gf_assist_co_workers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      user_id: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      gf_assist_id: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('gf_assist_co_workers');
  },
};
