'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('global_template', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      metadata: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      template_file_id: {
        allowNull: true,
        type: Sequelize.BIGINT.UNSIGNED,
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
    await queryInterface.dropTable('global_template');
  },
};
