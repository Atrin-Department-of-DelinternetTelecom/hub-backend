'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('unpaid_invoices', {
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
      client_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      exception: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      invoice_date: {
        type: Sequelize.DATE,
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
      unpaid_fee: {
        type: Sequelize.DECIMAL(11, 2),
      },
      xml_id: {
        type: Sequelize.BIGINT.UNSIGNED,
      },
      template_id: {
        type: Sequelize.BIGINT.UNSIGNED,
      },
      template: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      generated_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      invoice_status: {
        type: Sequelize.ENUM('paid', 'issued', 'unpaid', 'canceled', 'cutted'),
        defaultValue: 'unpaid',
      },
      send_method: {
        type: Sequelize.ENUM('sms', 'telegram', 'whatsapp', 'email'),
      },
      cut_date: {
        type: Sequelize.DATE,
      },
      bank_id: {
        type: Sequelize.BIGINT.UNSIGNED,
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      event_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      fallback_sms_counter: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
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
    await queryInterface.dropTable('unpaid_invoices');
  },
};
