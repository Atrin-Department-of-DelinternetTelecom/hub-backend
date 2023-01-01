'use strict';

module.exports = {
  up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn('unpaid_invoices', 'invoice_commission_id', {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      }),
      queryInterface.addColumn('unpaid_invoices', 'commission_payment_status', {
        type: Sequelize.ENUM('paid', 'unpaid', 'non_payable'),
        defaultValue: 'non_payable',
      }),
    ]);
  },

  down(queryInterface, Sequelize) {
    // logic for reverting the changes
    return Promise.all([
      queryInterface.removeColumn(
        'unpaid_invoices',
        'commission_payment_status',
      ),
      queryInterface.removeColumn('unpaid_invoices', 'invoice_commission_id'),
    ]);
  },
};
