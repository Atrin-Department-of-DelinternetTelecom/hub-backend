'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('web_call_me_taggables', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      callme_id: {
        allowNull: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      tag_id: {
        allowNull: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      comment: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('web_call_me_taggables');
  },
};
