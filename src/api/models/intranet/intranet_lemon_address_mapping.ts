import { DataTypes, Model, Sequelize } from 'sequelize';

import { ADDRESS } from '@api/constants/address';
import { DatabaseModels } from '@models';
import { get as config } from '@config';

export class LemonAddressMapping extends Model {
  declare id: number;
  declare type: ADDRESS;
  declare name: string;
  declare code: string | null;
  declare lemon_id: number;

  static associate(models: DatabaseModels) {}
}

export function init(sequelize: Sequelize) {
  LemonAddressMapping.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      type: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      code: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      lemon_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
    },
    {
      sequelize,
      modelName: 'LemonAddressMapping',
      schema: config('index.sequelize.intranet.database'),
      underscored: true,
      timestamps: false,
    },
  );

  return LemonAddressMapping;
}
