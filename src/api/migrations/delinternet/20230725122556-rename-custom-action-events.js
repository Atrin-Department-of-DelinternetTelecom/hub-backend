'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable(
      'custom_action_events',
      'global_custom_action_events',
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable(
      'global_custom_action_events',
      'custom_action_events',
    );
  },
};
