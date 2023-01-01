'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Step 1: Add the new 'paymentTypeId' column to 'gf_clients' table
    await queryInterface.addColumn('gf_clients', 'paymentTypeId', {
      type: Sequelize.DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      after: 'isRemitance',
    });

    // Step 2: Fetch the ids from 'invoice_payment_types'
    const [results] = await queryInterface.sequelize.query(`
      SELECT id, type FROM invoice_payment_types
      WHERE type IN ('Shipment', 'BankTransfer')
    `);

    const shipmentTypeId =
      results.find((row) => row.type === 'Shipment')?.id ?? null;
    const bankTransferTypeId =
      results.find((row) => row.type === 'BankTransfer')?.id ?? null;

    // Step 3: Update 'paymentTypeId' in 'gf_clients' based on 'isRemitance' value
    await queryInterface.sequelize.query(`
      UPDATE gf_clients
      SET paymentTypeId = CASE 
        WHEN isRemitance = true THEN ${shipmentTypeId}
        WHEN isRemitance = false THEN ${bankTransferTypeId}
        ELSE NULL
      END
    `);
  },

  async down(queryInterface, Sequelize) {
    // Step 4: Remove the 'paymentTypeId' column from 'gf_clients' table in case of rollback
    await queryInterface.removeColumn('gf_clients', 'paymentTypeId');
  },
};
