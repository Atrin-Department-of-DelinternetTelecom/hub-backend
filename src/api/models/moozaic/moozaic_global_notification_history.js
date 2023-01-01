'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const GlobalNotificationsHistory = sequelize.define(
    'GlobalNotificationsHistory',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      uid: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: config.get('index.intranet.uid'),
      },
      concept: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      app: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      subject: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      package: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      cardRead: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      image: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      icon: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      metadata: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      uniqueId: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      usedRueId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      debug: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'global_notifications_history',
      schema: 'moozaic',
      defaultScope: {
        ...intranet.defaultScope,
      },
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
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

  GlobalNotificationsHistory.associate = function (models) {
    GlobalNotificationsHistory.belongsTo(models.CrNotificationPreference, {
      foreignKey: 'usedRueId',
      as: 'preference',
    });
  };
  return GlobalNotificationsHistory;
};
