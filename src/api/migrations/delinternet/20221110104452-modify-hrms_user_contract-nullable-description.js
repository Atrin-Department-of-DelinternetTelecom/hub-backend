'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('hrms_user_contracts', 'description', {
      type: Sequelize.STRING,
      allowNull: true,
      default: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('hrms_user_contracts', 'description');
  },
};
