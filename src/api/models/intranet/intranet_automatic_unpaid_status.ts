import { DataTypes, Model, Sequelize } from 'sequelize';
import { DatabaseModels } from '@models';
import { defaultScope } from '@utils/intranet';

export class AutomaticUnpaidStatus extends Model {
  declare id: number;
  declare method: string;
  declare bankName: string;
  declare state: 'success' | 'error';
  declare fetchDate: Date;

  static associate(models: DatabaseModels) {
    // Define associations if needed
  }
}

export function init(sequelize: Sequelize) {
  AutomaticUnpaidStatus.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      method: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      bankName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      state: {
        type: DataTypes.ENUM('success', 'error'),
        allowNull: false,
      },
      fetchDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      errorDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
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
      tableName: 'automatic_unpaid_statuses',
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
          fields: [
            {
              name: 'id',
            },
          ],
        },
      ],
    },
  );

  return AutomaticUnpaidStatus;
}
