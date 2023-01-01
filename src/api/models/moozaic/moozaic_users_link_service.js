'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');
const { unserialize } = require('locutus/php/var');

module.exports = function (sequelize, DataTypes) {
  const MoozaicUsersLinkService = sequelize.define(
    'MoozaicUsersLinkService',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      uid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: config.get('index.intranet.uid'),
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: config.get('index.intranet.uid'),
      },
      service: {
        type: DataTypes.ENUM('google'),
        defaultValue: 'google',
      },
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      unserializedToken: {
        type: DataTypes.VIRTUAL,
        get() {
          return unserialize(this.token);
        },
      },
      externalUserId: {
        type: DataTypes.STRING(255),
        allowNull: false,
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
      tableName: 'moozaic_users_link_services',
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

  MoozaicUsersLinkService.associate = function (models) {
    MoozaicUsersLinkService.belongsTo(models.GlobalGoogleCalendar, {
      foreignKey: 'userId',
      targetKey: 'userId',
      as: 'calendarInfo',
    });
    MoozaicUsersLinkService.belongsTo(models.User, {
      foreignKey: 'userId',
      targetKey: 'userId',
      as: 'user',
    });
  };
  return MoozaicUsersLinkService;
};
