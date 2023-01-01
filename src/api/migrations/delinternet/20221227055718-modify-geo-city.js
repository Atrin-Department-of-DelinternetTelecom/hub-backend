'use strict';

module.exports = {
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('geo_cities', 'auto_update', {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    });
  },
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async down(queryInterface, { DataTypes }) {
    await queryInterface.removeColumn('geo_cities', 'auto_update');
  },
};
