'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('crm_tasks', 'hubFile', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('crm_tasks', 'hubFile2', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('crm_tasks', 'hubFile3', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('crm_tasks', 'hubFile4', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('crm_tasks', 'hubFile5', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('crm_tasks', 'hubFile6', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('crm_tasks', 'hubFile');
    await queryInterface.removeColumn('crm_tasks', 'hubFile2');
    await queryInterface.removeColumn('crm_tasks', 'hubFile3');
    await queryInterface.removeColumn('crm_tasks', 'hubFile4');
    await queryInterface.removeColumn('crm_tasks', 'hubFile5');
    await queryInterface.removeColumn('crm_tasks', 'hubFile6');
  },
};
