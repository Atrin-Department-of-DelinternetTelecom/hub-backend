'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
const moment = require('moment');
const { Op } = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  const InvoicePayment = sequelize.define(
    'InvoicePayment',
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
      invoiceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      budgetId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      invoiceLineId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      trace: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      pack: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      compensativeFromCancelPack: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      serieId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      code: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      efectiveDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      quantity: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      moneyTypeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      setPaidUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      moneyTypeObject: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      state: {
        type: DataTypes.ENUM(
          'paid',
          'due',
          'canceled',
          'refunded',
          'shiped',
          'returned',
        ),
        allowNull: true,
      },
      paymentType: {
        type: DataTypes.INTEGER,
        defaultValue: null,
        allowNull: true,
      },
      tpvId: {
        type: DataTypes.INTEGER,
        defaultValue: null,
        allowNull: true,
      },
      canceledPaymentId: {
        type: DataTypes.INTEGER,
        defaultValue: null,
        allowNull: true,
      },
      visible: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      refererApp: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      dueDateFormatted: {
        type: DataTypes.VIRTUAL,
        get() {
          return moment(this.getDataValue('dueDate')).format('YYYY-MM-DD');
        },
      },
      refererKey: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      remitanceId: {
        type: DataTypes.INTEGER,
        defaultValue: null,
        allowNull: true,
      },
      shopId: {
        type: DataTypes.INTEGER,
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
      tableName: 'invoice_payments',
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

  InvoicePayment.associate = function (models) {
    InvoicePayment.belongsTo(models.InvoiceRemitances, {
      foreignKey: 'remitanceId',
      as: 'invoice_remitance',
    });

    InvoicePayment.belongsTo(models.GfInvoiceInvoice, {
      foreignKey: 'invoiceId',
      as: 'invoice',
    });

    InvoicePayment.belongsTo(models.InvoicePaymentType, {
      foreignKey: 'paymentType',
      as: 'payment_type',
    });

    InvoicePayment.belongsTo(models.InvoiceMoneyTypes, {
      foreignKey: 'moneyTypeId',
      as: 'money_type',
    });

    InvoicePayment.belongsTo(models.MoozaicUser, {
      foreignKey: 'setPaidUserId',
      as: 'setPaidUser',
    });

    InvoicePayment.belongsTo(models.Warehouse, {
      foreignKey: 'shopId',
      as: 'shop',
    });
  };

  InvoicePayment.searchClient = async function (likeString) {
    likeString = `%${likeString}%`;

    const invoices = await sequelize.models.InvoicePayment.findAll({
      include: {
        model: sequelize.models.GfInvoiceInvoice,
        as: 'invoice',
        include: {
          model: sequelize.models.InvoiceClient,
          as: 'invoice_client',
          where: {
            [Op.or]: {
              businessName: {
                [Op.like]: likeString,
              },
              nif: {
                [Op.like]: likeString,
              },
            },
          },
        },
      },
    });
    return {
      key: Op.or,
      where: {
        id: invoices.map((item) => item.id),
      },
    };
  };

  return InvoicePayment;
};
