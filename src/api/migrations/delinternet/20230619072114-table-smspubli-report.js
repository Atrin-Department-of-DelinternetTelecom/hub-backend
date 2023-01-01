'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.createTable('global_smspubli_report', {
      id: {
        type: DataTypes.STRING(255),
        primaryKey: true,
      },
      from: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      to: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      custom: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      sms_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          'DELIVRD',
          'ACCEPTD',
          'EXPIRED',
          'DELETED',
          'UNDELIV',
          'UNKNOWN',
          'REJECTD',
        ),
        allowNull: false,
      },
      dlr_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('global_smspubli_report');
  },
};
