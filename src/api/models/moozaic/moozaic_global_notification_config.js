'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const GlobalNotificationsConfig = sequelize.define(
    'GlobalNotificationsConfig',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      uid: {
        type: DataTypes.INTEGER,
        defaultValue: config.get('index.intranet.uid'),
      },
      concept: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      app: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      lang: {
        type: DataTypes.STRING(3),
        allowNull: true,
      },
      subject: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      senderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      imapFolder: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      useCustomTexts: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      useCustomSender: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
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
      tableName: 'global_notifications_config',
      schema: 'moozaic',
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

  GlobalNotificationsConfig.associate = function (models) {};
  return GlobalNotificationsConfig;
};
