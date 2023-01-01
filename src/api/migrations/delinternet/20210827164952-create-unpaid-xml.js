'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('unpaid_xmls', {
      id: {
        autoIncrement: true,
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      auto_execute: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      executed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      template_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      send_method: {
        type: Sequelize.ENUM('sms', 'telegram', 'whatsapp', 'email'),
        defaultValue: 'whatsapp',
      },
      message_template: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      invoice_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      bank_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      msg_period: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      msgs_per_period: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      msg_hour: {
        type: Sequelize.DATE,
      },
      xml_file: {
        type: Sequelize.STRING,
        defaultValue: ' ',
      },
      unpaid_fee: {
        type: Sequelize.DECIMAL(11, 2),
        defaultValue: 7.5,
      },
      start_sending_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable('unpaid_xmls');
  },
};
