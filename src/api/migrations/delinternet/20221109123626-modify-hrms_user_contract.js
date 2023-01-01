'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint(
      'hrms_user_contracts',
      'hrms_user_contracts_ibfk_2',
    );
    await queryInterface.changeColumn('hrms_user_contracts', 'owner_id', {
      type: Sequelize.STRING,
      allowNull: true,
      default: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('hrms_user_contracts', 'owner_id');
  },
};
