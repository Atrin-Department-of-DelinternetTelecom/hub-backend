'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('unpaid_xmls', 'file_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('unpaid_xmls', 'file_id');
  },
};
