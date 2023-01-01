'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('installation_reports', 'operational_cost', {
      type: DataTypes.DECIMAL(11, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('installation_reports', 'material_cost', {
      type: DataTypes.DECIMAL(11, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('installation_reports', 'total_cost', {
      type: DataTypes.DECIMAL(11, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('installation_reports', 'discount_id', {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    });

    await queryInterface.addColumn(
      'installation_report_materials',
      'unit_price',
      {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
    );
    await queryInterface.addColumn(
      'installation_report_materials',
      'total_price',
      {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
    );

    await queryInterface.addColumn('technician_materials', 'unit_price', {
      type: DataTypes.DECIMAL(11, 2),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('installation_reports', 'total_cost');
    await queryInterface.removeColumn('installation_reports', 'material_cost');
    await queryInterface.removeColumn(
      'installation_reports',
      'operational_cost',
    );
    await queryInterface.removeColumn('installation_reports', 'discount_id');

    await queryInterface.removeColumn(
      'installation_report_materials',
      'total_price',
    );
    await queryInterface.removeColumn(
      'installation_report_materials',
      'unit_price',
    );

    await queryInterface.removeColumn('technician_materials', 'unit_price');
  },
};
