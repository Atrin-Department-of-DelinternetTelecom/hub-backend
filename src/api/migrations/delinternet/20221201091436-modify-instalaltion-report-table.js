'use strict';

module.exports = {
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('installation_reports', 'is_assistance', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    });

    await queryInterface.addColumn('installation_reports', 'description', {
      type: DataTypes.TEXT,
      allowNull: true,
    });
  },
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('installation_reports', 'is_assistance');
    await queryInterface.removeColumn('installation_reports', 'description');
  },
};
