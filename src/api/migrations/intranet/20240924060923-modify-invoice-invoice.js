'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('invoice_invoice', 'actualPayDate', {
      type: Sequelize.DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.sequelize.query(`
      UPDATE invoice_invoice
      SET actualPayDate = payDate Where state <> 'proforma'
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('invoice_invoice', 'actualPayDate');
  },
};
