'use strict';

module.exports = {
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('geo_streets', 'import_numbers', {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });

    await queryInterface.addColumn('geo_streets', 'numbers_imported_at', {
      type: DataTypes.DATE,
      allowNull: true,
    });
  },
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async down(queryInterface, { DataTypes }) {
    await queryInterface.removeColumn('geo_streets', 'import_numbers');
    await queryInterface.removeColumn('geo_streets', 'numbers_imported_at');
  },
};
