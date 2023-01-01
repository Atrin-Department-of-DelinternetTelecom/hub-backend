'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('hrms_grant_permission', 'done', {
      allowNull: false,
      defaultValue: false,
      type: Sequelize.DataTypes.BOOLEAN,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('hrms_grant_permission', 'done');
  },
};
