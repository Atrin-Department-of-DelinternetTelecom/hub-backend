import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Sequelize } from 'sequelize';

import { CELL_PROVIDER_CODE } from '@api/constants/contracts';
import assert from 'assert';
import config from '@config';
import { defaultScope } from '@utils/intranet';

export class GfCellProvider extends Model {
  declare id: number;
  declare uid: number;
  declare name: string;
  declare code: CELL_PROVIDER_CODE;
  declare status: number;
  declare creationDate: Date;
  declare updateDate: Date;
  // relationships
  declare gf_fees?: AnyModel[];

  static associate(models: DatabaseModels) {
    GfCellProvider.hasMany(models.GfFee, {
      foreignKey: 'cellProviderId',
      as: 'gf_fees',
    });
  }

  static async findByCode(code: CELL_PROVIDER_CODE): Promise<GfCellProvider> {
    const provider = await GfCellProvider.findOne({ where: { code } });
    assert(provider, `${GfCellProvider.name} with code:${code} not found.`);

    return provider;
  }
}

export function init(sequelize: Sequelize) {
  GfCellProvider.init(
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
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      code: {
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
      tableName: 'gf_cell_providers',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope,
      scopes: {
        aire: {
          where: {
            code: 'aire',
          },
        },
      },

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

  return GfCellProvider;
}
