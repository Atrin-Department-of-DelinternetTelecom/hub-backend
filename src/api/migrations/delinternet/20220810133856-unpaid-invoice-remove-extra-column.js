'use strict';

module.exports = {
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {*} Sequelize
   */
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      'unpaid_invoices',
      'commission_payment_status',
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'unpaid_invoices',
      'commission_payment_status',
      {
        type: Sequelize.ENUM('paid', 'unpaid', 'non_payable'),
        defaultValue: 'non_payable',
      },
    );
  },
};
