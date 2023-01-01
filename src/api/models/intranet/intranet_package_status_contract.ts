import { DatabaseModels } from '@models';
import { DataTypes, Model, Op, Sequelize } from 'sequelize';

import config from '@config';

export class PackageStatusContract extends Model {
  declare id: number;
  declare contractId: number;
  declare packageStatusId: number;

  static associate(models: DatabaseModels) {
    PackageStatusContract.belongsTo(models.PackageStatus, {
      foreignKey: 'packageStatusId',
      as: 'package',
    });
  }
}

export function init(sequelize: Sequelize) {
  PackageStatusContract.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      packageStatusId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      contractId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'package_status_contracts',
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      schema: 'intranet',
      timestamps: true,
      defaultScope: {
        where: {
          status: {
            [Op.not]: config.get('index.intranet.deleteStatus'),
          },
        },
      },
    },
  );

  return PackageStatusContract;
}
