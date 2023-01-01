'use strict';

module.exports = {
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {*} Sequelize
   */
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('hrms_closet', 'name', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {*} Sequelize
   */
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('hrms_closet', 'name');
  },
};
