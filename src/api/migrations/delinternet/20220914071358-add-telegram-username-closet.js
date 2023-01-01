'use strict';

module.exports = {
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {*} Sequelize
   */
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('hrms_closet', 'owner_telegram_username', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {*} Sequelize
   */
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('hrms_closet', 'owner_telegram_username');
  },
};
