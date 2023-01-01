'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('crm_task_types', 'preventCreateManually', {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn(
      'crm_task_types',
      'preventCreateManually',
    );
  },
};
