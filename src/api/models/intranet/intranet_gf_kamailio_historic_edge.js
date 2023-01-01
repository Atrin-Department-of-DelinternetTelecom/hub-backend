'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const GfKamailioHistoricEdge = sequelize.define(
    'GfKamailioHistoricEdge',
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
      contractId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      periodId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      number: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      edgeI: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      edgeR: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      edgeM: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      edgeN: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      costI: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      costR: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      costM: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      costN: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      costO: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      costU: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      minutesI: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      minutesR: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      minutesM: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      minutesN: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      minutesO: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      minutesU: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      totalI: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      totalR: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      totalM: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      totalN: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      totalO: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      totalU: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      month: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      edges: {
        type: DataTypes.TEXT,
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
      tableName: 'gf_kamailio_historic_edges',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: {
        ...intranet.defaultScope,
      },
      schema: 'intranet',
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

  GfKamailioHistoricEdge.associate = function (models) {};

  return GfKamailioHistoricEdge;
};
