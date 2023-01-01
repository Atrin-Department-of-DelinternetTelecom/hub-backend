'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('unpaid_operator_notifications', {
      id: {
        autoIncrement: true,
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      invoice_code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      invoice_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      creator_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.TEXT,
        defaultValue: '{}',
      },
      relatedmodel: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      relatedmodel_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      seenby_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      seen_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      seen: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      message: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      client_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
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
    await queryInterface.dropTable('unpaid_operator_notifications');
  },
};
