'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('technician_cancel_reasons', 'category', {
      type: DataTypes.STRING(),
      allowNull: false,
      defaultValue: '*',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('technician_cancel_reasons', 'category');
  },
};
