'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const EmployeeLanguage = sequelize.define(
    'EmployeeLanguage',
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
      reading: {
        type: DataTypes.ENUM(
          'Elementry proficiency',
          'limited working proficiency',
          'professional working proficiency',
          'full professional proficiency',
          'native or bilingual proficiency',
        ),
        allowNull: true,
      },
      listening: {
        type: DataTypes.ENUM(
          'Elementry proficiency',
          'limited working proficiency',
          'professional working proficiency',
          'full professional proficiency',
          'native or bilingual proficiency',
        ),
        allowNull: true,
      },
      speaking: {
        type: DataTypes.ENUM(
          'Elementry proficiency',
          'limited working proficiency',
          'professional working proficiency',
          'full professional proficiency',
          'native or bilingual proficiency',
        ),
        allowNull: true,
      },
      writing: {
        type: DataTypes.ENUM(
          'Elementry proficiency',
          'limited working proficiency',
          'professional working proficiency',
          'full professional proficiency',
          'native or bilingual proficiency',
        ),
        allowNull: true,
      },
      language: {
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
      tableName: 'hrms_employee_language',
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

  EmployeeLanguage.associate = function (models) {
    EmployeeLanguage.belongsTo(models.User, {
      foreignKey: 'employee_id',
      as: 'employee',
    });
  };

  return EmployeeLanguage;
};
