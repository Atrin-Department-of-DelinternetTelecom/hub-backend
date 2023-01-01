'use strict';

import { CreationOptional, DataTypes, Model, Sequelize } from 'sequelize';

import { DatabaseModels } from '@models';
import { FILE_TRANSFER } from '@api/constants/statuses';
import { get as config } from '@config';

export class FileTransfer extends Model {
  declare id: CreationOptional<number>;
  declare model_name: string;
  declare model_id: number;
  declare path: string;
  declare field: string | null;
  declare filename: string;
  declare bucket: string;
  declare error: string;
  declare state: string;

  static associate(models: DatabaseModels) {}
}

export function init(sequelize: Sequelize) {
  FileTransfer.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      model_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      model_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      path: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      field: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      filename: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      bucket: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      error: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: FILE_TRANSFER.SCHEDULED,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'global_file_transfers',
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
  return FileTransfer;
}
