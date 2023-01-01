'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('geo_cities', 'import_numbers', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('geo_cities', 'import_numbers', {
      type: Sequelize.TINYINT(1),
      allowNull: true,
      defaultValue: null,
    });
  },
};
