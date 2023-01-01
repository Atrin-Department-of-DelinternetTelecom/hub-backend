import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Op, Sequelize, literal } from 'sequelize';

import { GfCellProvider } from './intranet_gf_cell_providers';
import { Tarifa } from '@delinternet/sdk-aire';
import config from '@config';
import intranet from '@utils/intranet';
import { intranet as knex } from '@lib/knex';

export class GfCellProviderFee extends Model {
  declare id: number;
  declare providerId: number | null;
  declare providerName: string;
  declare providerFeeId: string;
  declare providerState: number;
  declare providerBaseQuote: string;
  declare tpvCode: string;
  declare status: number;
  declare creationDate: Date;
  declare updateDate: Date;
  // relationships
  declare gf_fees?: AnyModel[];
  declare provider?: GfCellProvider;
  declare invoice_product?: AnyModel;

  isActive() {
    return Boolean(this.providerState);
  }

  static associate(models: DatabaseModels) {
    GfCellProviderFee.hasMany(models.GfFee, {
      foreignKey: 'cellFee',
      as: 'gf_fees',
    });
    GfCellProviderFee.hasOne(models.GfActiveFee, {
      foreignKey: 'cellFee',
    });
    GfCellProviderFee.belongsTo(models.GfCellProvider, {
      foreignKey: 'providerId',
      as: 'provider',
    });
    GfCellProviderFee.hasOne(models.InvoiceProduct, {
      foreignKey: 'code',
      sourceKey: 'tpvCode',
      as: 'invoice_product',
    });
  }

  async ensureOfTpvCode() {
    if (!this.tpvCode) {
      await this.update({ tpvCode: this.providerFeeId });
    }

    return this;
  }

  toAireTraifa(): Tarifa {
    return {
      nombre_tarifa: this.providerName,
      importe_tarifa: this.providerBaseQuote,
      siglas: this.providerFeeId,
      importe_sms: '',
      importe_establecimiento: '',
      minutos: '',
      megas: '',
      gb: '',
      sms: '',
      tipo_cliente_final: '',
      tipo: '',
      estado: this.providerState > 0 ? 'ON' : 'OFF',
      descripcion: '',
      combinado_plan_fijo: '',
      importe_minutos: '',
      tipo_tarifa: '',
      origen_contratacion: '',
    };
  }

  fillFromTarifa(
    providerState: boolean,
    providerName: string,
    providerBaseQuote: number,
  ) {
    return this.set({
      providerState,
      providerName,
      // prevent fee change to zero
      // since Lemon makes the price zero for deleting fee
      providerBaseQuote: Number(
        providerBaseQuote > 0 ? providerBaseQuote : this.providerBaseQuote,
      ),
    });
  }

  static async searchImported(imported: unknown) {
    const subQuery = knex('intranet.active_gf_fees_view AS x')
      .select(1)
      .where('x.status', '=', 1)
      .where('x.cellFee', '=', knex.raw('GfCellProviderFee.id'))
      .toQuery();

    return {
      key: Op.and,
      where: Number(imported)
        ? literal(`EXISTS (${subQuery})`)
        : literal(`NOT EXISTS (${subQuery})`),
    };
  }
}

export function init(sequelize: Sequelize) {
  GfCellProviderFee.init(
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
      providerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      providerName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      providerFeeId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      providerState: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      providerBaseQuote: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: true,
      },
      tpvCode: {
        type: DataTypes.STRING,
        allowNull: true,
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
      tableName: 'gf_cell_providers_fees',
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

  return GfCellProviderFee;
}
