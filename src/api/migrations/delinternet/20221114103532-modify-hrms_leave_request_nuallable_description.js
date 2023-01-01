'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('hrms_leave_requests', 'status', {
      type: Sequelize.ENUM(
        'pending-request',
        'approved-request',
        'on-vacation',
        'canceled-request',
        'vacation-ended',
        'finished',
      ),
      allowNull: false,
    });
    await queryInterface.changeColumn('hrms_leave_requests', 'description', {
      type: Sequelize.STRING,
      allowNull: true,
      default: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('hrms_leave_requests', 'status', {
      type: Sequelize.ENUM(
        'pending-request',
        'approved-request',
        'on-vacation',
        'canceled-request',
        'pending-sign',
        'vacation-ended',
        'finished',
      ),
      allowNull: false,
    });
    await queryInterface.changeColumn('hrms_leave_requests', 'description');
  },
};
