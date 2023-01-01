'use strict';

import { AnyModel, DatabaseModels } from '@models';
import { CreationOptional, DataTypes, Model, Sequelize } from 'sequelize';

import { get as config } from '@config';

export class IvozDifference extends Model {
  declare id: CreationOptional<number>;
  declare gf_contract_id: CreationOptional<number>;
  declare extension: string;
  declare is_configured: CreationOptional<boolean>;
  declare has_valid_state: CreationOptional<boolean>;
  declare is_active: CreationOptional<boolean>;
  declare GfContract?: AnyModel;
  declare GfContractDataFix?: AnyModel;

  static associate(models: DatabaseModels) {
    IvozDifference.hasMany(models.GfContractDataFix, {
      sourceKey: 'extension',
      foreignKey: 'extension',
    });
    IvozDifference.belongsTo(models.GfContract, {});
  }
}

export function init(sequelize: Sequelize) {
  IvozDifference.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      gf_contract_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      extension: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      is_configured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      has_valid_state: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'ivoz_differences',
      timestamps: true,
      paranoid: false,
      underscored: true,
      schema: config('index.sequelize.system.database'),
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
  return IvozDifference;
}
