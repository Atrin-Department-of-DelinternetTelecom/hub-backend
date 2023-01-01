'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('hrms_message', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      text: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      creator_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      from_user_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      to_user_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      read: {
        allowNull: false,
        defaultValue: 1,
        type: Sequelize.BOOLEAN,
      },
      filter: {
        allowNull: true,
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('hrms_message');
  },
};
