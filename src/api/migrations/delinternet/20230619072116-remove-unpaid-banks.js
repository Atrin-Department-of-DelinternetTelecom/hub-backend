'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.removeColumn('unpaid_invoices', 'bank_id');
    await queryInterface.removeColumn('unpaid_xmls', 'bank_id');
    await queryInterface.dropTable('unpaid_banks');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.createTable('unpaid_banks', {
      id: {
        autoIncrement: true,
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      iban: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bic: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bic_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      invoice_id: {
        type: Sequelize.BIGINT.UNSIGNED,
      },
      xml_id: {
        type: Sequelize.BIGINT.UNSIGNED,
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
      },
      uid: {
        type: Sequelize.BIGINT.UNSIGNED,
      },
      status: {
        type: Sequelize.INTEGER,
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
    await queryInterface.addColumn('unpaid_invoices', 'bank_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
    });
    await queryInterface.addColumn('unpaid_xmls', 'bank_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
    });
  },
};
