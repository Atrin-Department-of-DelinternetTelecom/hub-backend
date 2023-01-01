'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('crm_task_types', 'label', {
      type: Sequelize.DataTypes.TEXT,
      defaultValue: '{"en": "","es": "","ca": ""}',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('crm_task_types', 'label');
  },
};
