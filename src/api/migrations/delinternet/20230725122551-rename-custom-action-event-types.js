'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable(
      'custom_action_event_types',
      'global_custom_action_event_types',
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable(
      'global_custom_action_event_types',
      'custom_action_event_types',
    );
  },
};
