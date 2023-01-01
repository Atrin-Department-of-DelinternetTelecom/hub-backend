'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');
const _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
  const CrTaskExtraField = sequelize.define(
    'CrTaskExtraField',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      uid: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: config.get('index.intranet.uid'),
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      visible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'crm_tasks_extra_fields',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: { ...intranet.defaultScope },
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

  CrTaskExtraField.associate = function (models) {
    CrTaskExtraField.belongsToMany(models.CrTask, {
      through: {
        model: models.CrTaskExtraFieldXref,
        scope: _.get(intranet, 'defaultScope.where', {}),
      },
      foreignKey: 'extraFieldId',
      otherKey: 'taskId',
      as: 'tasks',
      timestamps: false,
      unique: false,
    });

    CrTaskExtraField.hasMany(models.GfCrmEventExtraField, {
      foreignKey: 'crmExtraFieldId',
      as: 'crmEvents',
    });
  };

  return CrTaskExtraField;
};
