'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  const InvoiceRemitanceLog = sequelize.define(
    'InvoiceRemitanceLog',
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
      remitanceId: {
        type: DataTypes.INTEGER,
        defaultValue: null,
        allowNull: true,
      },
      paymentId: {
        type: DataTypes.INTEGER,
        defaultValue: null,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM('discard', 'error'),
        allowNull: true,
      },
      reason: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      metadata: {
        type: DataTypes.TEXT,
        defaultValue: null,
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
      tableName: 'invoice_remitance_log',
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

  InvoiceRemitanceLog.associate = function (models) {
    InvoiceRemitanceLog.belongsTo(models.InvoicePayment, {
      foreignKey: 'paymentId',
      as: 'payment',
    });
    InvoiceRemitanceLog.belongsTo(models.InvoiceRemitances, {
      foreignKey: 'remitanceId',
      as: 'remitance',
    });
  };

  InvoiceRemitanceLog.searchInvoice = async (value) => {
    const likeString = `%${value.replace('%', '')}%`;

    return {
      key: Sequelize.Op.and,
      where: {
        '$payment.invoice.code$': {
          [Sequelize.Op.like]: likeString,
        },
      },
    };
  };

  InvoiceRemitanceLog.searchPayment = async (value) => {
    const likeString = `%${value.replace('%', '')}%`;

    return {
      key: Sequelize.Op.and,
      where: {
        '$payment.code$': {
          [Sequelize.Op.like]: likeString,
        },
      },
    };
  };

  InvoiceRemitanceLog.searchClient = async (value) => {
    const likeString = `%${value.replace('%', '')}%`;

    return {
      key: Sequelize.Op.and,
      where: {
        '$payment.invoice.client.name$': {
          [Sequelize.Op.like]: likeString,
        },
      },
    };
  };
  return InvoiceRemitanceLog;
};
