'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const GfInvoiceControl = sequelize.define(
    'GfInvoiceControl',
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
      periodId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      invoiceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      invoiceProfileId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      total: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      baseTotal: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      taxsTotal: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      emailSent: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      emailId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      sorryEmailSent: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      payDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      periodDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      issued: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      issuedNumber: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      remounted: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      qRemounted: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      mustRemount: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      isRegularized: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      withError: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      mustReview: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      errorDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      errorPhase: {
        type: DataTypes.ENUM('invoiced', 'issued', 'emailSent'),
        allowNull: true,
      },
      cueued: {
        type: DataTypes.ENUM('waiting', 'processing', 'processed', 'cueued'),
        allowNull: true,
      },
      cueuedIssued: {
        type: DataTypes.ENUM('waiting', 'processing', 'processed', 'cueued'),
        allowNull: true,
      },
      cueuedEmail: {
        type: DataTypes.ENUM('waiting', 'processing', 'processed', 'cueued'),
        allowNull: true,
      },
      invoiceAction: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
        get() {
          return `${this.invoiceId ?? ''}::${this.issuedNumber ?? ''}`;
        },
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
      tableName: 'gf_invoice_control',
      schema: 'intranet',
      timestamps: true,
      updatedAt: 'updateDate',
      createdAt: 'creationDate',
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
  GfInvoiceControl.associate = function (models) {
    GfInvoiceControl.belongsTo(models.GfClient, {
      foreignKey: 'clientId',
      as: 'client',
    });

    GfInvoiceControl.belongsTo(models.InvoiceClientsInvoiceProfile, {
      foreignKey: 'invoiceProfileId',
      as: 'invoice_profile',
    });

    GfInvoiceControl.belongsTo(models.GfInvoiceInvoice, {
      foreignKey: 'invoiceId',
      as: 'invoice',
    });

    GfInvoiceControl.belongsTo(models.GfInvoicePeriod, {
      foreignKey: 'periodId',
      as: 'period',
    });

    GfInvoiceControl.hasMany(models.GfAireInvoiceLine, {
      foreignKey: 'controlRowId',
      as: 'aire_lines',
    });
  };

  GfInvoiceControl.searchClientInfo = async (value) => {
    const likeString = `%${value}%`;

    return {
      key: Sequelize.Op.or,
      where: {
        '$client.name$': {
          [Sequelize.Op.like]: likeString,
        },
        clientId: {
          [Sequelize.Op.like]: likeString,
        },
      },
    };
  };

  return GfInvoiceControl;
};
