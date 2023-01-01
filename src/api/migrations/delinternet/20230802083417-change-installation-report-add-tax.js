'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('installation_reports', 'sub_total_cost', {
      type: DataTypes.DECIMAL(11, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('installation_reports', 'tax_rate', {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('installation_reports', 'sub_total_cost');
    await queryInterface.removeColumn('installation_reports', 'tax_rate');
  },
};
