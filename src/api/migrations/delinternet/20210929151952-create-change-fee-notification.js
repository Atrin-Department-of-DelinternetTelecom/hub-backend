'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('unpaid_change_fee_notifications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      old_fee_group_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      new_fee_group_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      client_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      contract_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      send_method: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      send_date: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      send_status: {
        type: Sequelize.ENUM('sent', 'pending', 'error', 'canceled'),
        defaultValue: 'pending',
      },
      result: {
        type: Sequelize.ENUM('pending', 'rejected', 'accept'),
        defaultValue: 'pending',
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      metadata: {
        defaultValue: '{}',
        type: Sequelize.TEXT,
        get: function () {
          return JSON.parse(this.getDataValue('metadata') || '{}');
        },
        set: function (value) {
          this.setDataValue('metadata', JSON.stringify(value));
        },
      },
      result_user_id: {
        allowNull: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      created_by_retry: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      to: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      creator_id: {
        allowNull: true,
        type: Sequelize.BIGINT.UNSIGNED,
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
    await queryInterface.dropTable('unpaid_change_fee_notifications');
  },
};
