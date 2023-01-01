'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('unpaid_settings', {
      id: {
        autoIncrement: true,
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      disabled_notifiers: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fallback_sms_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      msg_period: {
        type: Sequelize.INTEGER,
      },
      msgs_per_period: {
        type: Sequelize.INTEGER,
      },
      msg_hour: {
        type: Sequelize.DATE,
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      uid: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      status: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('unpaid_settings');
  },
};
