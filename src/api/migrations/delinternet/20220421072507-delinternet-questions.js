'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return await queryInterface.createTable('delinternet_questions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true,
      },
      order: {
        type: Sequelize.INTEGER,
        defaultValue: 9999999,
        allowNull: false,
      },
      group: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      title: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.dropTable('delinternet_questions');
  },
};
