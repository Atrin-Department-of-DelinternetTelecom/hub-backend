'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return await queryInterface.createTable('delinternet_articles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      summary: {
        type: Sequelize.STRING(250),
        allowNull: true,
        defaultValue: null,
      },
      content: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
        defaultValue: null,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      locale: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'en',
      },
      group: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      featured: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      hits: {
        type: Sequelize.INTEGER({ unsigned: true }),
        allowNull: false,
        defaultValue: 0,
      },
      release_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      archive_date: {
        type: Sequelize.DATE,
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
    return await queryInterface.dropTable('delinternet_articles');
  },
};
