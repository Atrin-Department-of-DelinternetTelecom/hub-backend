'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('web_categories_packs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      category_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      pack_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      weight: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      published: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      type: {
        allowNull: false,
        type: Sequelize.ENUM('pack', 'product'),
      },
      default_definition: {
        allowNull: true,
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('web_categories_packs');
  },
};
