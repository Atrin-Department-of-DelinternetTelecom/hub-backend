'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('global_counter', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      key: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      init: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      max: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      value: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      model_name: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      model_id: {
        allowNull: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('global_counter');
  },
};
