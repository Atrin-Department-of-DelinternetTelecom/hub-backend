'use strict';

module.exports = {
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('web_landing_page', 'procesed', {
      allowNull: false,
      defaultValue: 0,
      type: DataTypes.BOOLEAN,
    });

    await queryInterface.addColumn('web_landing_page', 'user_processed_id', {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    });

    await queryInterface.addColumn('web_landing_page', 'status', {
      allowNull: true,
      type: DataTypes.ENUM('pending', 'checked', 'rejected'),
      defaultValue: 'pending',
    });
  },
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('web_landing_page', 'procesed');
    await queryInterface.removeColumn('web_landing_page', 'user_processed_id');
    await queryInterface.removeColumn('web_landing_page', 'status');
  },
};
