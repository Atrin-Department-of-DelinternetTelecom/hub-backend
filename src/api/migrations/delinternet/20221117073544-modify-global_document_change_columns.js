'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn(
      'global_documents',
      'base_data_complete',
      {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        deafult: 1,
      },
    );
    await queryInterface.addColumn(
      'global_documents',
      'is_signature_uploaded',
      {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        deafult: 0,
      },
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('global_documents', 'base_data_complete');
    await queryInterface.removeColumn(
      'global_documents',
      'is_signature_uploaded',
    );
  },
};
