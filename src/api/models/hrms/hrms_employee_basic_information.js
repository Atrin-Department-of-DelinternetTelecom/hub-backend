'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const EmployeeBasicInformation = sequelize.define(
    'EmployeeBasicInformation',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      employee_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      employee_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      birth_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: false,
      },
      marital_status: {
        type: DataTypes.ENUM(
          'single',
          'married',
          'divorced',
          'widowed',
          'other',
        ),
        allowNull: true,
      },
      immigration_status: {
        type: DataTypes.ENUM(
          'citizen',
          'permanent resident',
          'work permit holder',
          'depandant pass holder',
        ),
        allowNull: true,
      },
      ssn_nric: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      nic: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      other_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      driving_license_no: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      employment_status_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      department_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      job_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      pay_grade: {
        type: DataTypes.ENUM(
          'manager',
          'executive',
          'assistant',
          'administrator',
        ),
        allowNull: true,
      },
      joined_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      confirmation_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      termination_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      work_station_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'hrms_employee_basic_information',
      timestamps: true,
      paranoid: true,
      underscored: true,
      schema: config.get('index.sequelize.system.database'),
      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'id' }],
        },
      ],
    },
  );

  EmployeeBasicInformation.associate = function (models) {
    EmployeeBasicInformation.belongsTo(models.User, {
      foreignKey: 'employee_id',
      as: 'employee',
    });
    EmployeeBasicInformation.belongsTo(models.EmploymentStatus, {
      foreignKey: 'employment_status_id',
      as: 'employment_status',
    });
    EmployeeBasicInformation.belongsTo(models.Department, {
      foreignKey: 'department_id',
      as: 'department',
    });
    EmployeeBasicInformation.belongsTo(models.Job, {
      foreignKey: 'job_id',
      as: 'job',
    });
  };
  return EmployeeBasicInformation;
};
