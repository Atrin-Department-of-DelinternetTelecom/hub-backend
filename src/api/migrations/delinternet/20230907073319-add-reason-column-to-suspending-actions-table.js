'use strict';

const { SUSPENSION_ACTION_TYPE } = require('@api/constants/contracts');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('suspending_actions', 'action_type', {
      allowNull: true,
      defaultValue: SUSPENSION_ACTION_TYPE.DELETE,
      type: Sequelize.DataTypes.STRING,
      after: 'comment',
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('suspending_actions', 'action_type');
  },
};
