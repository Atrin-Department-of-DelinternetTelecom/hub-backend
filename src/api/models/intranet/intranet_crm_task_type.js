'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');
const _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
  const crTaskType = sequelize.define(
    'CrTaskType',
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
      tag: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      label: {
        allowNull: true,
        type: DataTypes.TEXT,
        get() {
          return JSON.parse(this.getDataValue('label') ?? '{}');
        },
        set(value) {
          this.setDataValue('label', JSON.stringify(value) ?? '{}');
        },
      },
      executable: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      rTaskFluxId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      forcePrevisionInFuture: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      icon: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      newIcon: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      leftRight: {
        type: DataTypes.ENUM('left', 'right'),
        allowNull: true,
      },
      excludedApps: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      onlyApps: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      preventCreateManually: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      hiddedOnCombo: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      tableName: 'crm_task_types',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: {
        ...intranet.defaultScope,
      },

      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [
            {
              name: 'id',
            },
          ],
        },
      ],
    },
  );

  crTaskType.associate = function (models) {
    crTaskType.belongsToMany(models.CrTaskType, {
      through: {
        model: models.CrmTaskTypeSon,
        scope: _.get(intranet, 'defaultScope.where', {}),
      },
      foreignKey: 'phatherId',
      otherKey: 'sonId',
      as: 'sons',
      timestamps: false,
      unique: false,
    });
    crTaskType.hasMany(models.GfCrmEvent, {
      foreignKey: 'type',
      sourceKey: 'id',
      as: 'crmEvents',
    });
  };
  return crTaskType;
};
