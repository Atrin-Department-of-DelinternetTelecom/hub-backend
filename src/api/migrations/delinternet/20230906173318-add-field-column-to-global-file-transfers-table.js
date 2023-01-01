'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('global_file_transfers', 'field', {
      allowNull: true,
      defaultValue: null,
      type: Sequelize.DataTypes.STRING,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('global_file_transfers', 'field');
  },
};
