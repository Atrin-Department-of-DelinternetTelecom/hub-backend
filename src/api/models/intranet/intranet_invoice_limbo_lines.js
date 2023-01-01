'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const LimboLines = sequelize.define(
    'LimboLines',
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
      group: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      pack: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      paymentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      productCode: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      units: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      unitObject: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      unitPrice: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      discountPercentage: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      discountTotal: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      taxObject: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      taxTotal: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      subTotal: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      includedTaxs: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      total: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      aditionalObject: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      userDescription: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      refererApp: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      refererKey: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      refererData: {
        type: DataTypes.TEXT,
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
      tableName: 'invoice_limbo_lines',
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

  return LimboLines;
};
