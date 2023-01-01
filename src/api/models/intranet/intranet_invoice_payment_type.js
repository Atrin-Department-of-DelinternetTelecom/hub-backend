'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  /**
   * @type {import("sequelize").Model}
   */
  const InvoicePaymentType = sequelize.define(
    'InvoicePaymentType',
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
        defaultValue: -1,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
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
      tableName: 'invoice_payment_types',
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

  InvoicePaymentType.associate = function (models) {
    InvoicePaymentType.hasMany(models.InvoicePayment, {
      foreignKey: 'paymentType',
      as: 'invoicePayments',
    });

    InvoicePaymentType.hasMany(models.GfInvoiceInvoice, {
      foreignKey: 'paymentType',
      as: 'invoices',
    });
  };

  InvoicePaymentType.defaultPaymentType = () => {
    return InvoicePaymentType.findOne({ where: { type: 'Shipment' } });
  };

  return InvoicePaymentType;
};
