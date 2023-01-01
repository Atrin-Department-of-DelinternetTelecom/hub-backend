'use strict';

module.exports = {
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('technician_tasks', 'cancel_reason_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn(
      'technician_tasks',
      'cancel_reason_description',
      {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    );

    await queryInterface.removeColumn('technician_tasks', 'cancel_reason');
  },
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async down(queryInterface, { DataTypes }) {
    await queryInterface.removeColumn('technician_tasks', 'cancel_reason_id');
    await queryInterface.removeColumn(
      'technician_tasks',
      'cancel_reason_description',
    );
    await queryInterface.addColumn('technician_tasks', 'cancel_reason', {
      type: DataTypes.STRING(255),
      allowNull: true,
    });
  },
};
