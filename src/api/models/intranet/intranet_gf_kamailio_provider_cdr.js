'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
const _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
  const GfKamailioProviderCdr = sequelize.define(
    'GfKamailioProviderCdr',
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
      hubFile: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      file: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      month: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      providerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      state: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      importMethod: {
        type: DataTypes.STRING(255),
        default: 'local',
      },
      progress: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      parsedPass: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      tableName: 'gf_kamailio_providers_cdr',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: {
        ...intranet.defaultScope,
      },
      schema: 'intranet',
      hooks: {
        afterFind: async (results) => {
          if (!results) {
            return;
          }

          if (!Array.isArray(results)) results = [results];

          const keys = [];
          for (const result of results) {
            keys.push(`GfKamailioProvidersCdr_${result.id}`);
          }

          const CounterService = require('../../service/global/CounterService');
          const values = await CounterService.getCounters(keys);

          for (const result of results) {
            result.progress = values[`GfKamailioProvidersCdr_${result.id}`];
          }
        },
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

  GfKamailioProviderCdr.associate = function (models) {
    GfKamailioProviderCdr.belongsTo(models.GfKamailioProvider, {
      foreignKey: 'providerId',
      as: 'provider',
    });
  };

  return GfKamailioProviderCdr;
};
