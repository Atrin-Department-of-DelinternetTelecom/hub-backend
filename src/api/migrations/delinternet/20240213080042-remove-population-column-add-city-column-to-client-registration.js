'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('client_registrations', 'population');
    await queryInterface.addColumn('client_registrations', 'city', {
      allowNull: true,
      type: Sequelize.DataTypes.TEXT,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('client_registrations', 'population', {
      allowNull: true,
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.removeColumn('client_registrations', 'city');
  },
};
