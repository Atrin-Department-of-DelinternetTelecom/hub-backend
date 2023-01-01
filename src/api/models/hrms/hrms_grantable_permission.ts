import { CreationOptional, DataTypes, Model, Sequelize } from 'sequelize';

import { DatabaseModels } from '@api/models';
import config from '@config';

export class GrantablePermission extends Model {
  declare id: CreationOptional<number>;
  declare name: string;
  declare description: string | null;

  static associate(models: DatabaseModels) {
    this.belongsToMany(models.GrantPermission, {
      through: models.GrantPermissionAssociation,
    });
  }

  static namesDefault(defaultValue = '') {
    return {
      ca: defaultValue,
      es: defaultValue,
    };
  }
}

export function init(sequelize: Sequelize) {
  GrantablePermission.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.TEXT('medium'),
        allowNull: false,
        get() {
          const value = this.getDataValue('name');
          try {
            return {
              ...GrantablePermission.namesDefault(value),
              ...JSON.parse(value),
            };
          } catch (error) {
            return GrantablePermission.namesDefault(value);
          }
        },
        set(value) {
          this.setDataValue(
            'name',
            typeof value !== 'string' ? JSON.stringify(value) : value,
          );
        },
      },
      description: {
        type: DataTypes.TEXT('medium'),
        allowNull: true,
      },
      active: {
        type: DataTypes.BOOLEAN(),
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: 'hrms_grantable_permissions',
      timestamps: false,
      underscored: true,
      schema: config.get('index.sequelize.system.database'),
    },
  );

  return GrantablePermission;
}
