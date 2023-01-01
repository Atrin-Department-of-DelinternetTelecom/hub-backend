'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('crm_tasks', 'displayFrom', {
      type: Sequelize.DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('crm_tasks', 'displayUntil', {
      type: Sequelize.DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('crm_tasks', 'displayFrom');
    await queryInterface.removeColumn('crm_tasks', 'displayUntil');
  },
};
