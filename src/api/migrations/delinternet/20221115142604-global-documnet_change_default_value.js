'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      'global_documents',
      'base_data_complete',
      {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        default: true,
      },
    );
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      'global_documents',
      'base_data_complete',
      {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        default: false,
      },
    );
  },
};
