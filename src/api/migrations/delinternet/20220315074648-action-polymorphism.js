'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('global_actions', 'model_name', {
      allowNull: true,
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn('global_actions', 'model_id', {
      allowNull: true,
      type: Sequelize.BIGINT.UNSIGNED,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('global_actions', 'model_name');
    await queryInterface.removeColumn('global_actions', 'model_id');
  },
};
