'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('gf_discounts_matrix_rules', 'type', {
      type: Sequelize.ENUM(
        'labeled_contract_present',
        'discount_present',
        'labeled_contract_bono_present',
      ),
      allowNull: false, // Set to true if the column allows NULL values
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the changes by removing the new ENUM value
    await queryInterface.changeColumn('gf_discounts_matrix_rules', 'type', {
      type: Sequelize.ENUM('labeled_contract_present', 'discount_present'),
      allowNull: false, // Set to true if the column allows NULL values
    });
  },
};
