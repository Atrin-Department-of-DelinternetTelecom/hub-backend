import { DataTypes, Model, Sequelize } from 'sequelize';

import { DatabaseModels } from '@models';
import { get as config } from '@config';

export class OperadorReseller extends Model {
  declare id: number;
  declare name: string;

  static associate(models: DatabaseModels) {}
}

export function init(sequelize: Sequelize) {
  OperadorReseller.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      tableName: 'operador_resellers',
      schema: config('index.sequelize.intranet.database'),
      timestamps: false,
      underscored: true,
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

  return OperadorReseller;
}
