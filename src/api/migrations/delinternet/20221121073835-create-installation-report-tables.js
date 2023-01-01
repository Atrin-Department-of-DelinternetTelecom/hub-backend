'use strict';

module.exports = {
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async up(queryInterface, { DataTypes }) {
    await queryInterface.createTable('installation_reports', {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      task_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      doc_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      client_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      client_phone: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      client_email: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      technician_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      elapsed_time: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      client_observation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      technician_observation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('installation_report_materials', {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      report_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      material_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      has_guarantee: {
        type: DataTypes.BOOLEAN,
      },
    });

    await queryInterface.createTable('installation_report_additional_works', {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      report_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      additional_work_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    });

    await queryInterface.createTable('technician_additional_works', {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      unit: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updated_at: {
        allowNull: true,
        type: DataTypes.DATE,
      },
    });

    await queryInterface.createTable('technician_materials', {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      unit: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updated_at: {
        allowNull: true,
        type: DataTypes.DATE,
      },
    });

    await queryInterface.addIndex('installation_report_materials', [
      'report_id',
    ]);

    await queryInterface.addIndex('installation_report_additional_works', [
      'report_id',
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('installation_reports');
    await queryInterface.dropTable('installation_report_materials');
    await queryInterface.dropTable('installation_report_additional_works');
    await queryInterface.dropTable('technician_additional_works');
    await queryInterface.dropTable('technician_materials');
  },
};
