import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Sequelize } from 'sequelize';

import { get as config } from '@config';
import { defaultScope } from '@utils/intranet';

export class GfContractDataSubscription extends Model {
  declare id: number;
  declare uid: number;
  declare contractId: number;
  declare status: number;
  declare creationDate: Date;
  declare updateDate: Date;
  // realtions
  declare contract?: AnyModel;
  declare internetContract?: AnyModel;

  static associate(models: DatabaseModels) {
    GfContractDataSubscription.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });
  }
}

export function init(sequelize: Sequelize) {
  GfContractDataSubscription.init(
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
      tableName: 'gf_contract_data_subscription',
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

  return GfContractDataSubscription;
}
