'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('geo_cities', 'import_streets', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('geo_cities', 'import_streets', {
      type: Sequelize.INTEGER(1),
      allowNull: true,
    });
  },
};
