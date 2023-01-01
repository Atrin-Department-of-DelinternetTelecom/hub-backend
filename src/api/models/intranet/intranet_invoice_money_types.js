'use strict';

const Sequelize = require('sequelize');
const { getConnection } = require('@lib/sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const InvoiceMoneyTypes = sequelize.define(
    'InvoiceMoneyTypes',
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
      name: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      code: {
        type: DataTypes.STRING(3),
        defaultValue: null,
      },
      symbol: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      conversion: {
        type: DataTypes.FLOAT,
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
      tableName: 'invoice_money_types',
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
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [
            {
              name: 'uid',
            },
          ],
        },
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [
            {
              name: 'status',
            },
          ],
        },
      ],
    },
  );

  InvoiceMoneyTypes.associate = function (models) {
    InvoiceMoneyTypes.hasMany(models.GfInvoiceInvoice, {
      foreignKey: 'moneyTypeCode',
      sourceKey: 'code',
      as: 'invoices',
    });
  };

  return InvoiceMoneyTypes;
};
