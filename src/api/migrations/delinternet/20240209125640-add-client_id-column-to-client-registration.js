'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('client_registrations', 'client_id', {
      allowNull: true,
      type: DataTypes.BIGINT.UNSIGNED,
    });
    await queryInterface.addColumn('client_registrations', 'status', {
      allowNull: true,
      type: DataTypes.ENUM('pending', 'checked'),
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('client_registrations', 'client_id');
    await queryInterface.removeColumn('client_registrations', 'status');
  },
};
