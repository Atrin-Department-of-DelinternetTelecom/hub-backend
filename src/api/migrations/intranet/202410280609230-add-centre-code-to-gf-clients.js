'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Step 1: Add the new 'centreCode' column to 'gf_clients' table
    await queryInterface.addColumn('gf_clients', 'centreCode', {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      after: 'fiscalId',
    });
  },

  async down(queryInterface, Sequelize) {
    // Step 4: Remove the 'centreCode' column from 'gf_clients' table in case of rollback
    await queryInterface.removeColumn('gf_clients', 'centreCode');
  },
};
