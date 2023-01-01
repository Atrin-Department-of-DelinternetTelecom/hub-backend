'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('client_registrations', 'mobile_lines1', {
      allowNull: true,
      type: DataTypes.TEXT,
    });
    await queryInterface.addColumn('client_registrations', 'mobile_lines2', {
      allowNull: true,
      type: DataTypes.TEXT,
    });
    await queryInterface.addColumn('client_registrations', 'mobile_rate1', {
      allowNull: true,
      type: DataTypes.TEXT,
    });
    await queryInterface.addColumn('client_registrations', 'mobile_rate2', {
      allowNull: true,
      type: DataTypes.TEXT,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('client_registrations', 'mobile_lines1');
    await queryInterface.removeColumn('client_registrations', 'mobile_lines2');
    await queryInterface.removeColumn('client_registrations', 'mobile_rate1');
    await queryInterface.removeColumn('client_registrations', 'mobile_rate2');
  },
};
