'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('web_categories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      code: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      alias: {
        allowNull: false,
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
    await queryInterface.dropTable('web_categories');
  },
};
