'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {
  const GfAireCdrStatus = sequelize.define(
    'GfAireCdrStatus',
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
      date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      state: {
        type: DataTypes.ENUM('cueued', 'pending', 'done', 'started', 'error'),
        allowNull: true,
      },
      lastMessage: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      totals: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      countedAireRecords: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      AireCdrManagerImport: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: true,
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
      tableName: 'gf_aire_cdr_status',
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

  GfAireCdrStatus.associate = function (models) {};

  GfAireCdrStatus.addHook('afterFind', async (results, query) => {
    if (!results) return;

    if (!Array.isArray(results)) {
      results = [results];
    }

    const CounterService = require('../../service/global/CounterService');

    const keys = [];
    for (const result of results) {
      keys.push(
        `AireCdrManagerImport_${moment(result.date)
          .utcOffset('+0000')
          .format('YYYY-MM-DD')}`,
      );
    }

    const values = await CounterService.getCounters(keys);

    for (const result of results) {
      result.AireCdrManagerImport =
        values[
          `AireCdrManagerImport_${moment(result.date)
            .utcOffset('+0000')
            .format('YYYY-MM-DD')}`
        ];
    }

    return results;
  });

  return GfAireCdrStatus;
};
