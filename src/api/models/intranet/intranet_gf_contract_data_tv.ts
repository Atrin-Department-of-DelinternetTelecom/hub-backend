import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Sequelize } from 'sequelize';

import { get as config } from '@config';
import { defaultScope } from '@utils/intranet';

export class GfContractDataTv extends Model {
  declare id: number;
  declare uid: number;
  declare contractId: number;
  declare internetContractId: number | null;
  declare status: number;
  declare creationDate: Date;
  declare updateDate: Date;
  // realtions
  declare contract?: AnyModel;
  declare internetContract?: AnyModel;

  static associate(models: DatabaseModels) {
    GfContractDataTv.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });
    GfContractDataTv.belongsTo(models.GfContract, {
      foreignKey: 'internetContractId',
      as: 'internetContract',
    });
  }
}

export function init(sequelize: Sequelize) {
  GfContractDataTv.init(
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
      contractId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      internetContractId: {
        type: DataTypes.INTEGER,
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
      tableName: 'gf_contract_data_tv',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',

      defaultScope,

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

  return GfContractDataTv;
}
