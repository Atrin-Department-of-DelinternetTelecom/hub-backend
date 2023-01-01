'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');
const _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
  const CrNotificationPreference = sequelize.define(
    'CrNotificationPreference',
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
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      alias: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      concept: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      email: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      autoRemoveBell: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      push: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      noExecuted: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      executed: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      noExecutables: {
        type: DataTypes.BOOLEAN,
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
      tableName: 'crm_notifications_preferences',
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

  CrNotificationPreference.associate = function (models) {
    CrNotificationPreference.belongsToMany(models.CrmUser, {
      through: {
        model: models.CrNotificationPreferencesUsersXref,
        scope: _.get(intranet, 'defaultScope.where', {}),
      },
      foreignKey: 'notificationsPreferencesId',
      otherKey: 'userId',
      targetKey: 'userId',
      as: 'users',
      timestamps: false,
      unique: false,
    });

    CrNotificationPreference.belongsToMany(models.CrTaskType, {
      through: {
        model: models.CrNotificationPreferencesTypesXref,
        scope: _.get(intranet, 'defaultScope.where', {}),
      },
      foreignKey: 'notificationsPreferencesId',
      otherKey: 'crmTypeId',
      as: 'types',
      timestamps: false,
      unique: false,
    });

    CrNotificationPreference.belongsToMany(models.CrTaskExtraField, {
      through: {
        model: models.CrNotificationPreferencesTagsXref,
        scope: _.get(intranet, 'defaultScope.where', {}),
      },
      foreignKey: 'notificationsPreferencesId',
      otherKey: 'crmTagId',
      as: 'tags',
      timestamps: false,
      unique: false,
    });
  };

  return CrNotificationPreference;
};
