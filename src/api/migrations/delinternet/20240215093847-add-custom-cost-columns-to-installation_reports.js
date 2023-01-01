'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'installation_reports',
      'custom_operational_cost',
      { type: Sequelize.DataTypes.DECIMAL(11, 2), allowNull: true },
    );
    await queryInterface.addColumn(
      'installation_reports',
      'custom_material_cost',
      { type: Sequelize.DataTypes.DECIMAL(11, 2), allowNull: true },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'installation_reports',
      'custom_operational_cost',
    );
    await queryInterface.removeColumn(
      'installation_reports',
      'custom_material_cost',
    );
  },
};
