'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('unpaid_notifications', {
      id: {
        autoIncrement: true,
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      invoice_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      client_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      task_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      send_method: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      send_status: {
        type: Sequelize.ENUM('sent', 'pending', 'error', 'canceled'),
        defaultValue: 'pending',
      },
      to: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sent_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      send_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_by_retry: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
    await queryInterface.dropTable('unpaid_notifications');
  },
};
