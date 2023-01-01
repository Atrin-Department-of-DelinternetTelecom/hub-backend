'use strict';

module.exports = {
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('invoice_payments', 'shopId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('invoice_payments', 'setPaidUserId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  },
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('invoice_payments', 'shopId');
    await queryInterface.removeColumn('invoice_payments', 'setPaidUserId');
  },
};
