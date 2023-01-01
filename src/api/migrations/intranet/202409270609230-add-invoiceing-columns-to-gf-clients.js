'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('gf_clients', 'sendInvoiceMail', {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
    await queryInterface.addColumn('gf_clients', 'dealtInvoiceAmount', {
      type: Sequelize.DataTypes.DECIMAL(15, 4),
      allowNull: true,
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('gf_clients', 'sendInvoiceMail');
    await queryInterface.removeColumn('gf_clients', 'dealtInvoiceAmount');
  },
};
