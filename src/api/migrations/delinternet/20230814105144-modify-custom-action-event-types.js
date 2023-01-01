'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn(
      'global_custom_action_event_types',
      'name',
      'presentation',
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn(
      'global_custom_action_event_types',
      'presentation',
      'name',
    );
  },
};
