import { DataTypes, Model, Sequelize } from 'sequelize';

import { ContractInitialFee } from './intranet_contract_initial_fee';
import { DatabaseModels } from '@models';
import { GfFee } from './intranet_gf_fees';
import { get as config } from '@config';

export class InitialFee extends Model {
  declare id: number;
  declare name: string;
  declare price: number;
  declare ContractInitialFee: ContractInitialFee;
  declare GfFee: GfFee[];

  static associate(models: DatabaseModels) {
    // define the relationships here
    InitialFee.belongsToMany(models.GfFee, { through: models.FeeInitialFee });
  }
}

export function init(sequelize: Sequelize) {
  InitialFee.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      name: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      price: {
        allowNull: false,
        type: DataTypes.DECIMAL,
      },
    },
    {
      sequelize,
      modelName: 'InitialFee',
      schema: config('index.sequelize.intranet.database'),
      timestamps: false,
      underscored: true,
    },
  );

  return InitialFee;
}
