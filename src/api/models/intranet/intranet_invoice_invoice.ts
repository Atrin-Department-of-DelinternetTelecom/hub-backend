import { DataTypes, Model, Op, Sequelize, col, fn } from 'sequelize';

import { AnyModel, DatabaseModels } from '@models';
import _ from 'lodash';
import { get as config } from '@config';
import intranet from '@utils/intranet';
import type { GfClient } from './intranet_gf_clients';
export class GfInvoiceInvoice extends Model {
  declare id: number;
  declare uid: number;
  declare shopId: number;
  declare serieId: number;
  declare payd: string;
  declare invoiceId: number;
  declare copyFrom: number;
  declare fromBudget: number;
  declare rectificativeFrom: number;
  declare code: string;
  declare date: Date;
  declare payDate: Date;
  declare actualPayDate: Date;
  declare clientId: number;
  declare clientName: string;
  declare clientNif: string;
  declare clientAddress: string;
  declare clientAddressNumber: string;
  declare clientCity: string;
  declare clientPostalCode: string;
  declare clientState: string;
  declare clientCountryIso: string;
  declare sellerName: string;
  declare sellerNif: string;
  declare sellerFormatedAddress: string;
  declare moneyTypeCode: string;
  declare moneyTypeObject: string;
  declare paymentPeriodType: number;
  declare paymentType: number;
  declare observations: string;
  declare total: number;
  declare baseTotal: number;
  declare taxesTotal: number;
  declare cons_totalPaid: number;
  declare userId: number;
  declare refererApp: string;
  declare refererKey: string;
  declare contabilityExported: number;
  declare contabilityRef: string;
  declare state: string;
  declare status: number;
  declare creationDate: Date;
  declare updateDate: Date;
  declare client: GfClient;
  declare shop: AnyModel;
  declare creator: AnyModel;
  declare invoice_client: AnyModel;
  declare control_row: AnyModel;
  declare invoice_lines: AnyModel[];
  declare payments: AnyModel[];
  declare country: AnyModel;
  declare invoice_serie: AnyModel;
  declare payment_type: AnyModel;
  declare money_type: AnyModel;
  declare period_type: AnyModel;
  declare unpaid_invoice: AnyModel;
  declare unpaid_fee: AnyModel;
  static searchClientInfo: (value: string) => Promise<{
    key: symbol;
    where: {
      clientId: { [Op.like]: string };
      '$client.name$': { [Op.like]: string };
      '$client.fiscalId$': { [Op.like]: string };
    };
  }>;

  static associate(models: DatabaseModels) {
    GfInvoiceInvoice.belongsTo(models.GfClient, {
      foreignKey: 'clientId',
      targetKey: 'invoiceClientId',
      as: 'client',
    });

    GfInvoiceInvoice.belongsTo(models.Warehouse, {
      foreignKey: 'shopId',
      as: 'shop',
    });

    GfInvoiceInvoice.belongsTo(models.MoozaicUser, {
      foreignKey: 'userId',
      as: 'creator',
    });

    GfInvoiceInvoice.belongsTo(models.InvoiceClient, {
      foreignKey: 'clientId',
      as: 'invoice_client',
    });

    GfInvoiceInvoice.hasOne(models.GfInvoiceControl, {
      foreignKey: 'invoiceId',
      as: 'control_row',
    });

    GfInvoiceInvoice.hasMany(models.InvoiceLine, {
      foreignKey: 'invoiceId',
      as: 'invoice_lines',
    });

    GfInvoiceInvoice.hasMany(models.InvoicePayment, {
      foreignKey: 'invoiceId',
      as: 'payments',
    });

    GfInvoiceInvoice.belongsTo(models.Country, {
      foreignKey: 'clientCountryIso',
      targetKey: 'isoCode',
      as: 'country',
    });

    GfInvoiceInvoice.belongsTo(models.InvoiceSerie, {
      foreignKey: 'serieId',
      as: 'invoice_serie',
    });

    GfInvoiceInvoice.belongsTo(models.InvoicePaymentType, {
      foreignKey: 'paymentType',
      as: 'payment_type',
    });

    GfInvoiceInvoice.belongsTo(models.InvoiceMoneyTypes, {
      foreignKey: 'moneyTypeCode',
      targetKey: 'code',
      as: 'money_type',
    });

    GfInvoiceInvoice.belongsTo(models.PaymentPeriodType, {
      foreignKey: 'paymentPeriodType',
      as: 'period_type',
    });

    GfInvoiceInvoice.hasOne(models.UnpaidInvoice, {
      foreignKey: 'invoice_id',
      as: 'unpaid_invoice',
    });

    GfInvoiceInvoice.hasOne(models.UnpaidInvoice, {
      foreignKey: 'invoice_commission_id',
      as: 'unpaid_fee',
    });

    GfInvoiceInvoice.belongsTo(models.GfInvoiceInvoice, {
      foreignKey: 'rectificativeFrom',
      as: 'rectificative_from',
    });
  }
}

export function init(sequelize: Sequelize) {
  GfInvoiceInvoice.init(
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
        defaultValue: config('index.intranet.uid'),
      },
      shopId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      serieId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      payd: {
        type: DataTypes.VIRTUAL,
        get() {
          if (
            ['unpaid', 'cutted'].includes(this.unpaid_invoice?.invoice_status)
          )
            return 'pending';

          let retValue;
          const totalPayd =
            this.getDataValue('cons_totalPaid') !== null
              ? parseFloat(this.getDataValue('cons_totalPaid'))
              : 0;
          if (this.getDataValue('state') === 'canceled') {
            retValue = 'unused';
            if (totalPayd > 0) {
              retValue = 'warning';
            }
          } else {
            if (this.getDataValue('state') === 'rectificative') {
              retValue = 'unused';
            } else {
              retValue = 'paid';
              if (
                totalPayd !== null &&
                totalPayd - this.getDataValue('total') < 0
              ) {
                retValue = 'pending';
              }
            }
          }
          return retValue;
        },
      },
      invoiceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      copyFrom: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      fromBudget: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      rectificativeFrom: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      code: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      payDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      actualPayDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      clientName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      clientNif: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      clientAddress: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      clientAddressNumber: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      clientCity: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      clientPostalCode: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      clientState: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      clientCountryIso: {
        type: DataTypes.STRING(3),
        allowNull: true,
      },
      sellerName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      sellerNif: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      sellerFormatedAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      moneyTypeCode: {
        type: DataTypes.STRING(3),
        allowNull: true,
      },
      moneyTypeObject: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      paymentPeriodType: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      paymentType: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      observations: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      total: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
        get() {
          if (!this.getDataValue('total')) return 0.0;
          return this.getDataValue('total');
        },
      },
      baseTotal: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
        get() {
          if (!this.getDataValue('baseTotal')) return 0.0;
          return this.getDataValue('baseTotal');
        },
      },
      taxesTotal: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
        get() {
          if (!this.getDataValue('taxesTotal')) return 0.0;
          return this.getDataValue('taxesTotal');
        },
      },
      cons_totalPaid: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      refererApp: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      refererKey: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      contabilityExported: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      contabilityRef: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      state: {
        type: DataTypes.ENUM('proforma', 'issued', 'canceled', 'rectificative'),
        allowNull: false,
        defaultValue: 'proforma',
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
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
      tableName: 'invoice_invoice',
      schema: 'intranet',
      timestamps: true,
      updatedAt: 'updateDate',
      createdAt: 'creationDate',
      defaultScope: {
        ...intranet.defaultScope,
      },
      scopes: {
        warning: {
          where: {
            state: 'canceled',
            cons_totalPaid: {
              [Op.gt]: 0,
            },
            status: {
              [Op.not]: config('index.intranet.deleteStatus'),
            },
            uid: {
              [Op.or]: [config('index.intranet.uid'), -1],
            },
          },
        },
        paid: {
          where: {
            [Op.and]: [
              {
                state: {
                  [Op.notIn]: ['rectificative', 'canceled'],
                },
                [Op.or]: {
                  total: {
                    [Op.lte]: fn('COALESCE', col('cons_totalPaid'), 0),
                  },
                },
                status: {
                  [Op.not]: config('index.intranet.deleteStatus'),
                },
                uid: {
                  [Op.or]: [config('index.intranet.uid'), -1],
                },
              },
              {
                [Op.or]: [
                  {
                    '$unpaid_invoice.invoice_status$': 'paid',
                  },
                  {
                    '$unpaid_invoice.id$': { [Op.is]: null },
                  },
                ],
              },
            ],
          },
        },
        pending: {
          where: {
            [Op.or]: [
              {
                state: {
                  [Op.notIn]: ['rectificative', 'canceled'],
                },
                total: {
                  [Op.gt]: fn('IFNULL', col('cons_totalPaid'), 0),
                },
                status: {
                  [Op.not]: config('index.intranet.deleteStatus'),
                },
                uid: {
                  [Op.or]: [config('index.intranet.uid'), -1],
                },
              },
              {
                '$unpaid_invoice.invoice_status$': {
                  [Op.in]: ['unpaid', 'cutted'],
                },
              },
            ],
          },
        },
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
          name: 'NewIndex1',
          using: 'BTREE',
          fields: [
            {
              name: 'clientId',
            },
          ],
        },
        {
          name: 'NewIndex2',
          using: 'BTREE',
          fields: [
            {
              name: 'uid',
            },
          ],
        },
        {
          name: 'NewIndex3',
          using: 'BTREE',
          fields: [
            {
              name: 'status',
            },
          ],
        },
        {
          name: 'NewIndex4',
          using: 'BTREE',
          fields: [
            {
              name: 'state',
            },
          ],
        },
        {
          name: 'creationDate',
          using: 'BTREE',
          fields: [
            {
              name: 'creationDate',
            },
          ],
        },
        {
          name: 'date',
          using: 'BTREE',
          fields: [
            {
              name: 'date',
            },
          ],
        },
        {
          name: 'code',
          using: 'BTREE',
          fields: [
            {
              name: 'code',
            },
          ],
        },
      ],
    },
  );

  GfInvoiceInvoice.searchClientInfo = async (value) => {
    const likeString = `%${value.replace(/%/g, '')}%`;
    return {
      key: Op.or,
      where: {
        clientId: {
          [Op.like]: likeString,
        },
        '$client.name$': {
          [Op.like]: likeString,
        },
        '$client.fiscalId$': {
          [Op.like]: likeString,
        },
      },
    };
  };

  return GfInvoiceInvoice;
}
