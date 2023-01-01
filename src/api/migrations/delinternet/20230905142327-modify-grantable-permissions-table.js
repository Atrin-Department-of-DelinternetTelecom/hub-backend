'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('hrms_grantable_permissions', 'name', {
      type: Sequelize.DataTypes.TEXT('medium'),
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('hrms_grantable_permissions', 'name', {
      type: Sequelize.DataTypes.STRING,
    });
  },
};
