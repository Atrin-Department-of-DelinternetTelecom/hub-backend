import { DataTypes, Model, Sequelize } from 'sequelize';

import { DatabaseModels } from '@models';
import { GfFee } from './intranet_gf_fees';
import { InitialFee } from './intranet_initial_fee';
import { get as config } from '@config';

export class FeeInitialFee extends Model {
  declare id: number;
  declare gf_fee_id: number;
  declare initial_fee_id: number;
  declare InitialFee: InitialFee;
  declare GfFee: GfFee;

  static associate(models: DatabaseModels) {
    // define the relationships here
    FeeInitialFee.belongsTo(models.GfFee);
    FeeInitialFee.belongsTo(models.InitialFee);
  }
}

export function init(sequelize: Sequelize) {
  FeeInitialFee.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      gf_fee_id: {
        allowNull: false,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      initial_fee_id: {
        allowNull: false,
        type: DataTypes.INTEGER.UNSIGNED,
      },
    },
    {
      sequelize,
      tableName: 'fee_initial_fee',
      modelName: 'FeeInitialFee',
      schema: config('index.sequelize.intranet.database'),
      timestamps: false,
      underscored: true,
    },
  );

  return FeeInitialFee;
}
