'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    // Add unique BTREE index on invoice_id column in unpaid_invoice table
    await queryInterface.addIndex('unpaid_invoices', ['invoice_id'], {
      name: 'unpaid_invoices_invoice_id_unique_index',
      unique: true,
      where: {
        status: 1,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex(
      'unpaid_invoices',
      'unpaid_invoices_invoice_id_unique_index',
    );
  },
};
