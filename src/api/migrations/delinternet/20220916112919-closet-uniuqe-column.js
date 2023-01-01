'use strict';

module.exports = {
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {*} Sequelize
   */
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('hrms_closet', 'code');
    await queryInterface.removeColumn('hrms_closet', 'deleted_at');
  },

  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {*} Sequelize
   */
  down: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('hrms_closet', 'code', {
      name: 'code',
      unique: true,
    });
    await queryInterface.addColumn('hrms_closet', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
};
