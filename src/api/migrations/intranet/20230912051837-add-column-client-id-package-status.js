'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('package_statuses', 'clientId', {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
    });
    await queryInterface.addColumn('package_statuses', 'userId', {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('package_statuses', 'clientId');
    await queryInterface.removeColumn('package_statuses', 'userId');
  },
};
