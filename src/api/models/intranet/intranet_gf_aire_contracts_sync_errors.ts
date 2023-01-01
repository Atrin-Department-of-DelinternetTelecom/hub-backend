import { AnyModel, DatabaseModels } from '..';
import { DataTypes, Model, Op, Sequelize } from 'sequelize';

import config from '@config';
import intranet from '@utils/intranet';

export class GfAireContractSyncError extends Model {
  declare id: number;
  declare uid: number;
  declare aireId: number;
  declare code: string;
  declare number: string;
  declare description: string;
  declare status: number;
  declare creationDate: Date;
  declare updateDate: Date;
  // relations
  declare GfAireContract: AnyModel;

  static associate(models: DatabaseModels): void {
    GfAireContractSyncError.belongsTo(models.GfAireContract, {
      foreignKey: 'aireId',
    });
  }
}

export function init(sequelize: Sequelize): typeof GfAireContractSyncError {
  GfAireContractSyncError.init(
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
      aireId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
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
      tableName: 'gf_aire_contracts_sync_errors',
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

  return GfAireContractSyncError;
}
