'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('hrms_material', 'doc_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      deafult: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('hrms_material', 'doc_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      deafult: null,
    });
  },
};
