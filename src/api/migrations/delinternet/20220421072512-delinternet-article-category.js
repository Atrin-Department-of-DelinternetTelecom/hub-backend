'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return await queryInterface.createTable('delinternet_article_category', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      delinternet_article_id: {
        type: Sequelize.INTEGER({ unsigned: true }),
        allowNull: true,
      },
      delinternet_category_id: {
        type: Sequelize.INTEGER({ unsigned: true }),
        allowNull: true,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.dropTable('delinternet_article_category');
  },
};
