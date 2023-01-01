'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    queryInterface.createTable('invoice_report_requests', {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      uid: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      invoiceIds: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      toEmail: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      state: {
        type: DataTypes.ENUM('in_progress', 'completed', 'error'),
        allowNull: false,
        defaultValue: 'in_progress',
      },
      error: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: true,
      },

      creationDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    queryInterface.dropTable('invoice_report_requests');
  },
};
