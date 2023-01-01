'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('web_call_me_visitors', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      visitor_id: {
        allowNull: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      callme_id: {
        allowNull: true,
        type: Sequelize.BIGINT.UNSIGNED,
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
    await queryInterface.dropTable('web_call_me_visitors');
  },
};
