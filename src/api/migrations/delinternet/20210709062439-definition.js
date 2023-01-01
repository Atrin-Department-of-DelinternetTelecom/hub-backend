'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('web_definitions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      alias: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      pack_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      weight: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      default: {
        allowNull: false,
        defaultValue: 1,
        type: Sequelize.BOOLEAN,
      },
      published: {
        allowNull: false,
        defaultValue: 1,
        type: Sequelize.BOOLEAN,
      },
      products_hide: {
        allowNull: false,
        defaultValue: 0,
        type: Sequelize.BOOLEAN,
      },
      features_hide: {
        allowNull: false,
        defaultValue: 0,
        type: Sequelize.BOOLEAN,
      },
      class_list: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      creator_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('web_definitions');
  },
};
