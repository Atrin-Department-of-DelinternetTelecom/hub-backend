'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const EmployeeCertification = sequelize.define(
    'EmployeeCertification',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      institute: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      granted_on: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      valid_until: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      certification: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      proof_doc_file_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      employee_id: {
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
      tableName: 'hrms_employee_certification',
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

  EmployeeCertification.associate = function (models) {
    EmployeeCertification.belongsTo(models.User, {
      foreignKey: 'employee_id',
      as: 'employee',
    });
    EmployeeCertification.belongsTo(models.File, {
      foreignKey: 'proof_doc_file_id',
      as: 'proof_doc',
    });
  };

  return EmployeeCertification;
};
