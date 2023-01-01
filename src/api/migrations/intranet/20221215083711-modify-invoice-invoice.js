'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('invoice_invoice', 'shopId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  },
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async down(queryInterface) {
    await queryInterface.removeColumn('invoice_invoice', 'shopId');
  },
};
