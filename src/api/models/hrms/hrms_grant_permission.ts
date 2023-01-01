import { AnyModel, DatabaseModels } from '..';
import {
  CreationOptional,
  DataTypes,
  Model,
  Optional,
  Sequelize,
} from 'sequelize';

import { GrantablePermission } from './hrms_grantable_permission';
import config from '@config';

export class GrantPermission extends Model {
  declare id: CreationOptional<number>;
  declare userId: CreationOptional<number>;
  declare clientId: number;
  declare client: AnyModel;
  declare authorizedName: string;
  declare authorizedFiscalId: string;
  declare isRevoked: boolean;
  declare done: boolean;
  declare docId: string;
  declare description: string;
  declare permissions?: GrantablePermission[];

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  static associate(models: DatabaseModels) {
    this.belongsTo(models.GfClient, {
      as: 'client',
      foreignKey: 'clientId',
    });
    this.belongsTo(models.Document, {
      as: 'document',
      foreignKey: 'docId',
    });
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      targetKey: 'userId',
    });
    this.belongsToMany(models.GrantablePermission, {
      as: 'permissions',
      through: models.GrantPermissionAssociation,
    });
  }
}

export function init(sequelize: Sequelize) {
  GrantPermission.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      authorizedName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      authorizedFiscalId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isRevoked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      done: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      docId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'hrms_grant_permission',
      timestamps: true,
      underscored: true,
      schema: config.get('index.sequelize.system.database'),
    },
  );

  return GrantPermission;
}
