import { CreationOptional, DataTypes, Model, Sequelize } from 'sequelize';

import config from '@config';

export class GrantPermissionAssociation extends Model {
  declare id: CreationOptional<number>;
  declare grantable_permission_id: number;
  declare grant_permission_id: number;
}

export function init(sequelize: Sequelize) {
  GrantPermissionAssociation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      grantable_permission_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      grant_permission_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'hrms_grant_permission_associations',
      timestamps: false,
      underscored: true,
      schema: config.get('index.sequelize.system.database'),
    },
  );

  return GrantPermissionAssociation;
}
