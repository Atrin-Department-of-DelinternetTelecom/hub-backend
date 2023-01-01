'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('gf_discounts_executed_usages', 'type', {
      type: Sequelize.ENUM('matrix', 'contract', 'contract-bono'),
      allowNull: false, // Set to true if the column allows NULL values
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the changes by removing the new ENUM value
    await queryInterface.changeColumn('gf_discounts_executed_usages', 'type', {
      type: Sequelize.ENUM('contract', 'matrix'),
      allowNull: false, // Set to true if the column allows NULL values
    });
  },
};
