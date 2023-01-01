'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('gf_discounts_matrix', 'dateActivation', {
      type: Sequelize.DataTypes.DATE,
      defaultValue: null,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('gf_discounts_matrix', 'dateActivation');
  },
};
