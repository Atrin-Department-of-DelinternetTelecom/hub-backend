'use strict';

const { FILE_TRANSFER } = require('@api/constants/statuses');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, { DataTypes }) => {
    await queryInterface.createTable('global_file_transfers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      model_name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      model_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      path: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      filename: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      bucket: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      error: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      state: {
        allowNull: false,
        type: DataTypes.STRING,
        defaultValue: FILE_TRANSFER.SCHEDULED,
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
    await queryInterface.dropTable('global_file_transfers');
  },
};
