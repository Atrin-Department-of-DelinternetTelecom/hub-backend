'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'gf_discounts_executed',
      'combinationExecutedTask',
      {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'gf_discounts_executed',
      'combinationExecutedTask',
    );
  },
};
