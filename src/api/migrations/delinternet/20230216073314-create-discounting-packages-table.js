'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('discounting_packages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
      name: {
        comment: 'Package name',
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
      },
      type: {
        comment: 'charge,discount',
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
      },
      months: {
        comment: 'duration of discount in months',
        allowNull: false,
        type: Sequelize.DataTypes.INTEGER.UNSIGNED,
      },
      activation_age: {
        comment: 'days that a contract must pass to include discount',
        allowNull: false,
        default: 30,
        type: Sequelize.DataTypes.INTEGER.UNSIGNED,
      },
      enabled: {
        comment: 'determine if package is enable',
        allowNull: false,
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: true,
      },
      label_id: {
        allowNull: true,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
      label_group_id: {
        allowNull: true,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
      creator_id: {
        allowNull: true,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
      start_date: {
        comment: 'package start date',
        allowNull: true,
        type: Sequelize.DataTypes.DATE,
      },
      expiration_date: {
        comment: 'pakcage end date',
        allowNull: true,
        type: Sequelize.DataTypes.DATE,
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DataTypes.DATE,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DataTypes.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DataTypes.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('discounting_packages');
  },
};
