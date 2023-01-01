'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const InvoiceRemitanceHistory = sequelize.define(
    'InvoiceRemitanceHistory',
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
      userId: {
        type: DataTypes.INTEGER,
        defaultValue: null,
        allowNull: true,
      },
      action: {
        type: DataTypes.ENUM(
          'create',
          'unset_confirmed',
          'set_confirmed',
          'deleted',
          'updated',
          'downloaded',
        ),
        allowNull: true,
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
      tableName: 'invoice_remitance_history',
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

  InvoiceRemitanceHistory.associate = function (models) {};
  return InvoiceRemitanceHistory;
};
