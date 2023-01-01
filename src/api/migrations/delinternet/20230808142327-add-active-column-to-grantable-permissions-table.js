'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('hrms_grantable_permissions', 'active', {
      allowNull: false,
      defaultValue: false,
      type: Sequelize.DataTypes.BOOLEAN,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('hrms_grantable_permissions', 'active');
  },
};
