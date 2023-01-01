'use strict';

module.exports = {
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('web_landing_page', 'client_id', {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    });
  },
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('web_landing_page', 'client_id');
  },
};
