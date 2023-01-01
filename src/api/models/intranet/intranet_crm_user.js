'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');
const _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
  const CrmUser = sequelize.define(
    'CrmUser',
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
      senderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      nickName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      image: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      googleCalendarId: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      patern: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
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
      tableName: 'crm_users',
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

  CrmUser.associate = function (models) {
    CrmUser.belongsTo(models.User, {
      foreignKey: 'userId',
      targetKey: 'userId',
      as: 'global_user',
    });
  };

  return CrmUser;
};
