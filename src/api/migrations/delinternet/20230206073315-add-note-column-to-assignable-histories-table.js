'use strict';

module.exports = {
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('assignable_histories', 'note', {
      allowNull: true,
      type: DataTypes.TEXT,
    });
    await queryInterface.changeColumn('assignable_histories', 'contract_id', {
      allowNull: true,
      type: DataTypes.BIGINT.UNSIGNED,
    });
  },
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('assignable_histories', 'note');
  },
};
