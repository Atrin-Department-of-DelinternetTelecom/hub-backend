'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn(
      'technician_cancel_reasons',
      'comment_required',
      {
        type: DataTypes.BOOLEAN(),
        allowNull: false,
        defaultValue: false,
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'technician_cancel_reasons',
      'comment_required',
    );
  },
};
