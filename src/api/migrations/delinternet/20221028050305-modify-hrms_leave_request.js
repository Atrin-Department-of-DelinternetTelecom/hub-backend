'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('hrms_leave_requests', 'status', {
      type: Sequelize.ENUM(
        'pending-request',
        'approved-request',
        'on-vacation',
        'canceled-request',
        'vacation-ended',
        'pending-sign',
        'finished',
      ),
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('hrms_leave_requests', 'status', {
      type: Sequelize.ENUM(
        'pending-request',
        'approved-request',
        'on-vacation',
        'canceled-request',
        'vacation-ended',
        'pending-sign',
        'finished',
      ),
      allowNull: false,
    });
  },
};
