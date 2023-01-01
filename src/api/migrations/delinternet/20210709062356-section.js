'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('web_sections', {
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
      code: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      weight: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      definition_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      discount: {
        allowNull: false,
        type: Sequelize.DECIMAL(11, 2),
      },
      discount_type: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      tax: {
        allowNull: false,
        type: Sequelize.DECIMAL(11, 2),
      },
      tax_type: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      discount_permanent: {
        allowNull: false,
        defaultValue: 0,
        type: Sequelize.BOOLEAN,
      },
      icon: {
        allowNull: true,
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable('web_sections');
  },
};
