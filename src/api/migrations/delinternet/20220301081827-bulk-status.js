'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('bulks', 'status', {
      type: Sequelize.ENUM(
        'scheduled',
        'running',
        'finished',
        'stopped',
        'paused',
      ),
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('bulks', 'status', {
      type: Sequelize.ENUM('scheduled', 'running', 'finished'),
      allowNull: false,
    });
  },
};
