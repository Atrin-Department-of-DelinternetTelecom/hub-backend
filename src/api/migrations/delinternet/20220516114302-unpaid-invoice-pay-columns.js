'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('unpaid_invoices', 'pay_date', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('unpaid_invoices', 'payment_type_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('unpaid_invoices', 'pay_date');
    await queryInterface.removeColumn('unpaid_invoices', 'payment_type_id');
  },
};
