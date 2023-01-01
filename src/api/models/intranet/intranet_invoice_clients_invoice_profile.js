'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const InvoiceClientsInvoiceProfile = sequelize.define(
    'InvoiceClientsInvoiceProfile',
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
      alias: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      iban: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bic: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bicName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      payTypeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      payDay: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      countryCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      postalCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        // validate: {
        //   isEmail: true
        // }
      },
      comments: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      serieId: {
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
      tableName: 'invoice_clients_invoice_profile',
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
        {
          name: 'payTypeIdIndex',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'payTypeId' }],
        },
        {
          name: 'serieIdIndex',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'serieId' }],
        },
      ],
    },
  );

  InvoiceClientsInvoiceProfile.associate = function (models) {
    InvoiceClientsInvoiceProfile.belongsTo(models.InvoiceSerie, {
      foreignKey: 'serieId',
      as: 'invoiceSerie',
    });

    InvoiceClientsInvoiceProfile.belongsTo(models.Country, {
      foreignKey: 'countryCode',
      targetKey: 'isoCode',
      as: 'country',
    });

    InvoiceClientsInvoiceProfile.belongsTo(models.InvoicePaymentType, {
      foreignKey: 'payTypeId',
      as: 'invoicePaymentType',
    });
  };

  return InvoiceClientsInvoiceProfile;
};
