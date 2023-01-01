'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.removeColumn(
      'installation_report_materials',
      'has_guarantee',
    );
  },

  async down(queryInterface, { DataTypes }) {
    await queryInterface.addColumn(
      'installation_report_materials',
      'has_guarantee',
      {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
    );
  },
};
