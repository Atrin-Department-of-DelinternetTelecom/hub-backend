'use strict';

import { CreationOptional, DataTypes, Model, Sequelize } from 'sequelize';

import { DatabaseModels } from '@models';
import { get as config } from '@config';

export class CpeDifference extends Model {
  declare id: CreationOptional<number>;
  declare gf_contract_id: CreationOptional<number>;
  declare serial_number: string;
  declare device_id: string;
  declare is_configured: CreationOptional<boolean>;
  declare need_factory_reset: CreationOptional<boolean>;
  declare has_credential_error: CreationOptional<boolean>;

  static associate(models: DatabaseModels) {
    CpeDifference.belongsTo(models.GfContractDataInternet, {
      targetKey: 'cpeSn',
      foreignKey: 'serial_number',
    });
    CpeDifference.belongsTo(models.GfContract);
  }
}

export function init(sequelize: Sequelize) {
  CpeDifference.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      serial_number: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'cpe serial number (cpeSn)',
      },
      device_id: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'id of device in cpe',
      },
      gf_contract_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        comment: 'indicates contract id',
      },
      is_configured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'indicates contract exists on cpe',
      },
      need_factory_reset: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'indicates cpe already configured for other connection',
      },
      has_credential_error: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'indicates cpe and contract has diffrent credentials',
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
      tableName: 'cpe_differences',
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
  return CpeDifference;
}
