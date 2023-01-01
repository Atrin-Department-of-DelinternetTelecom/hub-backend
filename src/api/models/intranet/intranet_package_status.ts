import { DataTypes, Model, Op, Sequelize } from 'sequelize';

import { DatabaseModels } from '@models';
import config from '@config';
import intranet from '@utils/intranet';

export class PackageStatus extends Model {
  declare id: number;
  declare matrixId: number;
  declare clientId: number;
  declare userId: number;
  declare status: string;

  static associate(models: DatabaseModels) {
    PackageStatus.belongsTo(models.GfDiscountsMatrix, {
      foreignKey: 'matrixId',
      as: 'matrix',
    });
    PackageStatus.belongsTo(models.GfClient, {
      foreignKey: 'clientId',
      as: 'client',
    });

    PackageStatus.belongsToMany(models.GfContract, {
      through: {
        model: models.PackageStatusContract,
        scope: {
          status: {
            [Op.not]: config.get('index.intranet.deleteStatus'),
          },
        },
      },
      foreignKey: 'packageStatusId',
      otherKey: 'contractId',
      as: 'contracts',
      timestamps: false,
    });
  }
}

export function init(sequelize: Sequelize) {
  PackageStatus.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      matrixId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      state: {
        type: DataTypes.ENUM('pending', 'applied', 'canceled'),
        allowNull: false,
        defaultValue: 'pending',
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
      tableName: 'package_statuses',
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

  return PackageStatus;
}
