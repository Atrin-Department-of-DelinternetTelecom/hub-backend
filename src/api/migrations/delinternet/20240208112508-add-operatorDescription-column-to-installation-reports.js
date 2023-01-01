'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn(
      'installation_reports',
      'operator_description',
      {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'installation_reports',
      'operator_description',
    );
  },
};
