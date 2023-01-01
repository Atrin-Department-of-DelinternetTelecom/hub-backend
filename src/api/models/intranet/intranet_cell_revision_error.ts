import { DataTypes, Model, Sequelize } from 'sequelize';

import { DatabaseModels } from '@models';
import _ from 'lodash';

export class CellRevisionError extends Model {
  declare id: number;
  declare number: string;
  declare fiscal_id: string;
  declare fee: string;
  declare group: string;
  declare provider: string;
  declare error: string;
  declare created_at: string;
  declare updated_at: string;

  static associate(models: DatabaseModels) {
    CellRevisionError.belongsTo(models.GfClient, {
      foreignKey: 'fiscal_id',
      targetKey: 'fiscalId',
    });
  }
}

export function init(sequelize: Sequelize) {
  CellRevisionError.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      number: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      fiscal_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      fee: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      group: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      provider: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      error: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'CellRevisionError',
      tableName: 'cell_revision_errors',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  return CellRevisionError;
}
