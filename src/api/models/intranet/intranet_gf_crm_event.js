'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');
const _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
  const GfCrmEvent = sequelize.define(
    'GfCrmEvent',
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
      reference: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      type: {
        type: DataTypes.INTEGER,
      },
      collaboratorId: {
        type: DataTypes.INTEGER,
      },
      clientTagsAnd: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.BOOLEAN,
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
      tableName: 'gf_crm_events',
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

  GfCrmEvent.associate = function (models) {
    GfCrmEvent.belongsToMany(models.GfUser, {
      through: {
        model: models.GfCrmEventUserXref,
        scope: _.get(intranet, 'defaultScope.where', {}),
      },
      foreignKey: 'gfCrmEventId',
      otherKey: 'userId',
      targetKey: 'userId',
      as: 'users',
      timestamps: false,
      unique: false,
    });

    GfCrmEvent.belongsTo(models.CrTaskType, {
      foreignKey: 'type',
      sourceKey: 'id',
      as: 'taskType',
    });

    GfCrmEvent.belongsTo(models.GfCollaborator, {
      foreignKey: 'collaboratorId',
      as: 'collaborator',
    });

    GfCrmEvent.belongsToMany(models.InvoiceClientsExtraField, {
      through: {
        model: models.GfCrmEventClientTag,
        scope: _.get(intranet, 'defaultScope.where', {}),
      },
      foreignKey: 'crmEventId',
      otherKey: 'extraFieldId',
      as: 'clientTags',
      timestamps: false,
      unique: false,
    });

    GfCrmEvent.belongsToMany(models.CrTaskExtraField, {
      through: {
        model: models.GfCrmEventExtraField,
        scope: _.get(intranet, 'defaultScope.where', {}),
      },
      foreignKey: 'gfCrmEventId',
      otherKey: 'crmExtraFieldId',
      as: 'crmExtraFields',
      timestamps: false,
      unique: false,
    });
  };

  return GfCrmEvent;
};
