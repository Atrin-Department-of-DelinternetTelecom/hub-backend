'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable('actions', 'global_actions');
    await queryInterface.renameTable('bulks', 'global_bulks');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable('global_actions', 'actions');
    await queryInterface.renameTable('global_bulks', 'bulks');
  },
};
