import { DataTypes, Model, Sequelize } from 'sequelize';

import { DatabaseModels } from '@models';
import config from '@config';

export class AccessTokenTag extends Model {
  declare id: string;
  declare access_token_id: number | null;
  declare contract_tag_id: number | null;

  static associate(models: DatabaseModels) {
    AccessTokenTag.belongsTo(models.AccessToken);
    AccessTokenTag.belongsTo(models.ContractTag);
  }
}

export function init(sequelize: Sequelize) {
  AccessTokenTag.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      access_token_id: {
        allowNull: false,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      contract_tag_id: {
        allowNull: false,
        type: DataTypes.INTEGER.UNSIGNED,
      },
    },
    {
      sequelize,
      tableName: 'access_token_tag',
      modelName: 'AccessTokenTag',
      timestamps: false,
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
  return AccessTokenTag;
}
