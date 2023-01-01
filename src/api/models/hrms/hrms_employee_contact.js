'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const EmployeeContact = sequelize.define(
    'EmployeeContact',
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
      home_phone: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      work_phone: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      mobile_phone: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(255),
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
      tableName: 'hrms_employee_contact',
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

  EmployeeContact.associate = function (models) {
    EmployeeContact.belongsTo(models.User, {
      foreignKey: 'employee_id',
      as: 'employee',
    });
  };

  return EmployeeContact;
};
