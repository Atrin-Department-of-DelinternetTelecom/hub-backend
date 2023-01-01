'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('web_definitions', 'home_page', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: 0,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('web_definitions', 'home_page');
  },
};
