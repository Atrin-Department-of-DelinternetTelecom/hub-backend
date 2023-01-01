'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('hrms_user_contracts', 'phone_number', {
      type: Sequelize.STRING,
      allowNull: true,
      deafult: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('hrms_user_contracts', 'phone_number');
  },
};
