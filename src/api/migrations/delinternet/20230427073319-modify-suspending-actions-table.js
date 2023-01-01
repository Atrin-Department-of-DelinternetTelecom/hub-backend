'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('suspending_actions', 'suspend_at', {
      allowNull: true,
      type: Sequelize.DataTypes.DATE,
    });
    await queryInterface.addColumn('suspending_actions', 'suspended_at', {
      allowNull: true,
      type: Sequelize.DataTypes.DATE,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('suspending_actions', 'suspend_at');
    await queryInterface.removeColumn('suspending_actions', 'suspended_at');
  },
};
