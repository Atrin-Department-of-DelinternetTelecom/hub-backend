'use strict';

const { USER_TYPE } = require('@api/constants/enum');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('technician_steps', 'media', {
      type: Sequelize.DataTypes.TEXT('medium'),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('technician_steps', 'media');
  },
};
