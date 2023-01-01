'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('web_definitions', 'metadata', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '{}',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('web_definitions', 'metadata');
  },
};
