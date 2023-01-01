'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('technician_tasks', 'cancelled_by_id', {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('technician_tasks', 'cancelled_by_id');
  },
};
