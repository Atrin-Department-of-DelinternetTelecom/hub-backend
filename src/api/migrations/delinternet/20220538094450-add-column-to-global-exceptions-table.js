'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('global_exceptions', 'state', {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: 'pending',
    });

    await queryInterface.addColumn('global_exceptions', 'extra', {
      type: Sequelize.TEXT('long'),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('global_exceptions', 'state');
    await queryInterface.removeColumn('global_exceptions', 'extra');
  },
};
