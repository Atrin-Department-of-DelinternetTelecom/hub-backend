'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.dropTable('unpaid_files');
  },

  async down(queryInterface, Sequelize) {},
};
