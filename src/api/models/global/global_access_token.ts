import { CreationOptional, DataTypes, Model, Sequelize } from 'sequelize';

import { DatabaseModels } from '@models';
import config from '@config';

export class AccessToken extends Model {
  declare id: string;
  declare username: string;
  declare password: string;
  declare token: string | null;
  declare expire: string | null;
  declare user_id: number | null;
  declare config: Record<string, unknown>;
  declare gf_collaborator_id: number | null;

  mergeConfig(key: string, value: unknown) {
    this.set('config', { ...this.config, [key]: value });

    return this;
  }

  static associate(models: DatabaseModels) {
    AccessToken.belongsTo(models.User, {
      foreignKey: 'user_id',
      targetKey: 'userId',
    });
    AccessToken.belongsTo(models.GfCollaborator, {
      foreignKey: 'gf_collaborator_id',
    });
    AccessToken.hasMany(models.AccessTokenTag);
  }
}

export function init(sequelize: Sequelize) {
  AccessToken.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      username: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      password: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      token: {
        allowNull: true,
        defaultValue: null,
        type: DataTypes.TEXT,
      },
      expire: {
        allowNull: true,
        defaultValue: null,
        type: DataTypes.DATE,
      },
      user_id: {
        allowNull: true,
        defaultValue: null,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      gf_collaborator_id: {
        allowNull: true,
        defaultValue: null,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      config: {
        allowNull: true,
        defaultValue: null,
        type: DataTypes.INTEGER.UNSIGNED,
        get() {
          return JSON.parse(this.getDataValue('config'));
        },
        set(value) {
          this.setDataValue('config', JSON.stringify(value));
        },
      },
      created_at: {
        allowNull: false,
        defaultValue: DataTypes.NOW,
        type: DataTypes.DATE,
      },
      updated_at: {
        allowNull: false,
        defaultValue: DataTypes.NOW,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      tableName: 'access_tokens',
      modelName: 'AccessToken',
      timestamps: true,
      paranoid: false,
      underscored: true,
      schema: config.get('index.sequelize.system.database'),
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
  return AccessToken;
}
