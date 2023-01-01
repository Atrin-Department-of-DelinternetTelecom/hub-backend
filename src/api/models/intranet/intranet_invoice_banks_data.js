'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const InvoiceBanksData = sequelize.define(
    'InvoiceBanksData',
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
      alias: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      iban: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      businessName: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      creditorId: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      moneyTypeId: {
        type: DataTypes.INTEGER,
        defaultValue: null,
        allowNull: true,
      },
      default: {
        type: DataTypes.INTEGER,
        defaultValue: null,
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
      tableName: 'invoice_banks_data',
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

  InvoiceBanksData.associate = function (models) {
    InvoiceBanksData.hasMany(models.InvoiceRemitances, {
      foreignKey: 'bankId',
      as: 'invoice_remitance',
    });

    InvoiceBanksData.belongsTo(models.InvoiceMoneyTypes, {
      foreignKey: 'moneyTypeId',
      as: 'money_type',
    });
  };
  return InvoiceBanksData;
};
