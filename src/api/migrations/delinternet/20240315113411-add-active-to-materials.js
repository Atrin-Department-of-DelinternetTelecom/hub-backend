'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('technician_materials', 'active', {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('technician_materials', 'active');
  },
};
