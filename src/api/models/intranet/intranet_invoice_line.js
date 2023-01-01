'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const InvoiceLine = sequelize.define(
    'InvoiceLine',
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
      productId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      invoiceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      limboLineId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      productCode: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      units: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      unitObject: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          if (this.getDataValue('unitObject') === 'null') {
            return null;
          }
          return this.getDataValue('unitObject');
        },
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
      includedTaxs: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      subTotal: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      total: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      order: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      blocked: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      blockedReason: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      refererApp: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      refererKey: {
        type: DataTypes.STRING(255),
        allowNull: true,
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
        allowNull: true,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'invoice_lines',
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
  InvoiceLine.associate = function (models) {
    InvoiceLine.belongsTo(models.GfInvoiceInvoice, {
      foreignKey: 'invoiceId',
      as: 'invoice',
    });
  };

  return InvoiceLine;
};
