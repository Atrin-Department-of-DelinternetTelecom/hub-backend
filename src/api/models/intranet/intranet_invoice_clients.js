'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
const { Op, where, fn, col } = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  const InvoiceClient = sequelize.define(
    'InvoiceClient',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      active: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      moozaicUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      alias: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      surname1: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      surname2: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      gender: {
        type: DataTypes.ENUM('male', 'female'),
        defaultValue: 'male',
      },
      businessName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isBusiness: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      logo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
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
      },
      countryCode: {
        type: DataTypes.STRING(3),
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
      nif: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      defaultCurrencyCode: {
        type: DataTypes.STRING(5),
        allowNull: true,
      },
      defaultPaymentPeriodType: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      defaultPaymentType: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      uid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: config.get('index.intranet.uid'),
      },
      comments: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      excludeFromMailings: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
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
      tableName: 'invoice_clients',
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
          name: 'moozaicUserIdIndex',
          using: 'BTREE',
          fields: [{ name: 'moozaicUserId' }],
        },
      ],
    },
  );

  InvoiceClient.associate = function (models) {
    InvoiceClient.hasOne(models.GfClient, {
      foreignKey: 'invoiceClientId',
      as: 'client',
    });

    InvoiceClient.hasMany(models.InvoiceClientsInvoiceProfile, {
      foreignKey: 'clientId',
      as: 'invoice_profiles',
    });

    InvoiceClient.hasMany(models.InvoiceClientUserXref, {
      foreignKey: 'clientId',
      as: 'users',
    });

    InvoiceClient.hasMany(models.InvoiceClientExtraFieldXref, {
      foreignKey: 'clientId',
      as: 'extraFields',
    });

    InvoiceClient.belongsTo(models.Country, {
      foreignKey: 'countryCode',
      targetKey: 'isoCode',
      as: 'country',
    });
  };

  InvoiceClient.searchConcat = async (value) => {
    return {
      key: Op.and,
      where: where(
        fn(
          'concat',
          col('businessName'),
          ' ',
          col('InvoiceClient.name'),
          ' ',
          col('surname1'),
          ' ',
          col('surname2'),
        ),
        Op.like,
        `%${value}%`,
      ),
    };
  };

  return InvoiceClient;
};
