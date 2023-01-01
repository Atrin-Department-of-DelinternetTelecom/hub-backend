'use strict';

module.exports = {
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('technician_tasks', 'started_at', {
      type: DataTypes.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('technician_tasks', 'finished_at', {
      type: DataTypes.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('technician_tasks', 'auto_close_at', {
      type: DataTypes.DATE,
      allowNull: true,
    });
  },
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('technician_tasks', 'started_at');
    await queryInterface.removeColumn('technician_tasks', 'finished_at');
    await queryInterface.removeColumn('technician_tasks', 'auto_close_at');
  },
};
