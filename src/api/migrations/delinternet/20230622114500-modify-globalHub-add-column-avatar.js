'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('global_users', 'avatar', {
      allowNull: true,
      type: Sequelize.DataTypes.STRING,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('global_users', 'avatar');
  },
};
