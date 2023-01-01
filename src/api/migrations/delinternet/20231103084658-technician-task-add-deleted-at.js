'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('technician_tasks', 'deleted_at', {
      type: DataTypes.DATE(),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('technician_tasks', 'deleted_at');
  },
};
