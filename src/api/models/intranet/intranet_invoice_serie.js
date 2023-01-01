'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const InvoiceSerie = sequelize.define(
    'InvoiceSerie',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      uid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: config.get('index.intranet.uid'),
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      prefix: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      creationDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: true,
      },
      updateDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'invoice_series',
      schema: 'intranet',
      timestamps: true,
      updatedAt: 'updateDate',
      createdAt: 'creationDate',

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

  return InvoiceSerie;
};
