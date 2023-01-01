'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
const moment = require('moment');
const _ = require('lodash');
module.exports = function (sequelize, DataTypes) {
  const GfDiscountsHistory = sequelize.define(
    'GfDiscountsHistory',
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
      scheduledId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      action: {
        type: DataTypes.ENUM(
          'draft',
          'scheduled',
          'applied',
          'edited',
          'deleted',
          'partialApplied',
        ),
        allowNull: false,
        defaultValue: 'edited',
      },
      amount: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
        defaultValue: 0,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      controlRowId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      previousRow: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '',
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      tableName: 'gf_discounts_history',
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

  GfDiscountsHistory.associate = function (models) {
    GfDiscountsHistory.belongsTo(models.GfDiscountsScheduled, {
      foreignKey: 'scheduledId',
      as: 'scheduled',
    });
    GfDiscountsHistory.belongsTo(models.GfUser, {
      foreignKey: 'userId',
      targetKey: 'userId',
      as: 'user',
    });
  };
  return GfDiscountsHistory;
};
