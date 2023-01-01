'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('suspending_reasons', 'active', {
      allowNull: false,
      defaultValue: false,
      type: Sequelize.DataTypes.BOOLEAN,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('suspending_reasons', 'active');
  },
};
