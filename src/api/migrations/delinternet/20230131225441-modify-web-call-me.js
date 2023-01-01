'use strict';

module.exports = {
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('web_call_me', 'reference', {
      type: DataTypes.ENUM('WEB', 'CLUB'),
      defaultValue: 'WEB',
    });
  },
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('web_call_me', 'reference');
  },
};
