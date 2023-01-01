'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('global_exceptions', 'error_origin', {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
      defaultValue: 'backend',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('global_exceptions', 'error_origin');
  },
};
