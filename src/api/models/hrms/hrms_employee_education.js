'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const EmployeeEducation = sequelize.define(
    'EmployeeEducation',
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
      qualification: {
        type: DataTypes.ENUM(
          'bachelors digree',
          'diploma',
          'masters digree',
          'doctorate',
        ),
        allowNull: false,
      },
      institute: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completed_on: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      proof_doc_file_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
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
      tableName: 'hrms_employee_education',
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

  EmployeeEducation.associate = function (models) {
    EmployeeEducation.belongsTo(models.User, {
      foreignKey: 'employee_id',
      as: 'employee',
    });
    EmployeeEducation.belongsTo(models.File, {
      foreignKey: 'proof_doc_file_id',
      as: 'proof_doc',
    });
  };
  return EmployeeEducation;
};
