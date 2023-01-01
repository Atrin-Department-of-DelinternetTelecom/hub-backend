'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const MoozaicMailSender = sequelize.define(
    'MoozaicMailSender',
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
      alias: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      mail: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      host: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      port: {
        type: DataTypes.INTEGER(3),
        allowNull: true,
      },
      userName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      ssl: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      imapHost: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      sentFolder: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      netErrors: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      currentFolders: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      forceUnseen: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      asDefault: {
        type: DataTypes.BOOLEAN,
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
      tableName: 'global_mail_senders',
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

  MoozaicMailSender.associate = function (models) {};
  return MoozaicMailSender;
};
