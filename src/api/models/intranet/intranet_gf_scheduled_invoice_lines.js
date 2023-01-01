'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
const { omit } = require('lodash');
module.exports = function (sequelize, DataTypes) {
  const GfScheduledInvoiceLine = sequelize.define(
    'GfScheduledInvoiceLine',
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
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      contractId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      isRecursive: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      initDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      payDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      procesed: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      withErrors: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'gf_scheduled_invoice_lines',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',

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

  GfScheduledInvoiceLine.associate = function (models) {
    GfScheduledInvoiceLine.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });
    GfScheduledInvoiceLine.belongsTo(models.GfClient, {
      foreignKey: 'clientId',
      as: 'client',
    });
  };

  GfScheduledInvoiceLine.prototype.duplicate = function (attributes = {}) {
    return new GfScheduledInvoiceLine({
      ...omit(this.get({ plain: true }), ['id', 'creationDate', 'updateDate']),
      ...attributes,
    });
  };

  return GfScheduledInvoiceLine;
};
