'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const InvoiceBudgets = sequelize.define(
    'InvoiceBudgets',
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
      serieId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      budgetId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      copyFrom: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: true,
      },
      validUntil: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: true,
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      clientName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      clientNif: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      clientAddress: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      clientCity: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      clientPostalCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      clientState: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      clientCountryIso: {
        type: DataTypes.STRING(3),
        allowNull: true,
      },
      moneyTypeCode: {
        type: DataTypes.STRING(3),
        allowNull: true,
      },
      total: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
      },
      baseTotal: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
      },
      taxesTotal: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
      },
      withTaxes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      state: {
        type: DataTypes.ENUM('pending', 'aproved', 'invoiced', 'canceled'),
        allowNull: false,
        defaultValue: 'pending',
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
      tableName: 'invoice_budgets',
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

  return InvoiceBudgets;
};
