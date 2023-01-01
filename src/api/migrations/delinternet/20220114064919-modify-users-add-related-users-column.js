'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('global_users', 'gf_user_id', {
      defaultValue: 0,
      type: Sequelize.INTEGER,
    });

    await queryInterface.addColumn('global_users', 'crm_user_id', {
      defaultValue: 0,
      type: Sequelize.INTEGER,
    });

    await queryInterface.addColumn('global_users', 'user_id', {
      defaultValue: 0,
      type: Sequelize.INTEGER,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('global_users', 'gf_user_id');
    await queryInterface.removeColumn('global_users', 'crm_user_id');
    await queryInterface.removeColumn('global_users', 'user_id');
  },
};
