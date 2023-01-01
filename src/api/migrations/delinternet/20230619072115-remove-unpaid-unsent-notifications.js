'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.dropTable('unpaid_un_sent_notifications');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.createTable('unpaid_un_sent_notifications', {
      id: {
        autoIncrement: true,
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      notification_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      client_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      sent_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      send_method: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      issue_date: {
        type: Sequelize.DATE,
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
};
