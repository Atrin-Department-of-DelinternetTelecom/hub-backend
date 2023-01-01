'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const InvoiceRemitances = sequelize.define(
    'InvoiceRemitances',
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
      file: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      hubFile: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      dateGenerated: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      total: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      refererKey: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      refererData: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      bankId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      limit: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      state: {
        type: DataTypes.ENUM(
          'pending',
          'shiped',
          'confirmed',
          'error',
          'generating',
          'set_as_paids',
        ),
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
      tableName: 'invoice_remitances',
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

  InvoiceRemitances.associate = function (models) {
    InvoiceRemitances.hasMany(models.InvoicePayment, {
      foreignKey: 'remitanceId',
      as: 'invoice_payment',
    });

    InvoiceRemitances.belongsTo(models.InvoiceBanksData, {
      foreignKey: 'bankId',
      as: 'bank',
    });

    InvoiceRemitances.belongsTo(models.File, {
      foreignKey: 'file',
      as: 'xmlfile',
    });

    InvoiceRemitances.hasMany(models.InvoiceRemitanceLog, {
      foreignKey: 'remitanceId',
      as: 'errors',
    });
  };

  InvoiceRemitances.addHook('afterUpdate', async (remittance, query) => {
    if (!remittance.id) return;
    const socket = require('@lib/socket');
    const { commands } = require('@constants/ws');
    socket.emit(commands.invoiceRemittance.update, remittance);
  });

  return InvoiceRemitances;
};
