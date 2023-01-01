'use strict';

import { CreationOptional, DATE, DataTypes, Model, Sequelize } from 'sequelize';

import { AnyModel, DatabaseModels } from '@models';
import config from '@config';

export class ChangeBankNumber extends Model {
  declare id: CreationOptional<number>;
  declare gf_client_id: number;
  declare user_id: CreationOptional<number>;
  declare doc_id: CreationOptional<number>;
  declare iban: string;
  declare bic: string;
  declare bank: string;
  declare done: CreationOptional<boolean>;
  declare created_at: CreationOptional<string>;
  declare updated_at: CreationOptional<string>;
  declare client?: AnyModel;

  static associate(models: DatabaseModels) {
    ChangeBankNumber.belongsTo(models.GfClient, {
      as: 'client',
      foreignKey: 'gf_client_id',
    });
    ChangeBankNumber.belongsTo(models.User, {
      targetKey: 'userId',
    });
    ChangeBankNumber.belongsTo(models.Document, {
      foreignKey: 'doc_id',
    });
  }
}

export function init(sequelize: Sequelize) {
  ChangeBankNumber.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      iban: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      bic: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      bank: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      gf_client_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      doc_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      done: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'change_bank_numbers',
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
  return ChangeBankNumber;
}
