import { DatabaseModels } from '@models';
import { DataTypes, Model, Sequelize } from 'sequelize';

import { get as config } from '@config';

export class LemonCdrStatus extends Model {
  declare id: number;
  declare date: Date;
  declare state: 'error' | 'pending' | 'done' | 'started';
  declare errorMessage: string | null;
  declare created_at: Date;
  declare updated_at: Date;

  static associate(models: DatabaseModels) {}
}

export function init(sequelize: Sequelize) {
  LemonCdrStatus.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      state: {
        type: DataTypes.ENUM('pending', 'done', 'started', 'error'),
        defaultValue: 'pending',
      },
      errorMessage: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'lemon_cdr_status',
      schema: config('index.sequelize.intranet.database'),
      timestamps: true,
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

  return LemonCdrStatus;
}
