'use strict';
import { CreationOptional, DataTypes, Model, Sequelize } from 'sequelize';
import config from '@config';
import { DatabaseModels } from '@models';

export class Bulk extends Model {
  declare id: CreationOptional<number>;
  declare creator_id: CreationOptional<string | null>;
  declare total_actions: number;
  declare total_fulfilled_actions: CreationOptional<number>;
  declare total_failed_actions: CreationOptional<number>;
  declare status: 'scheduled' | 'running' | 'finished' | 'stopped' | 'paused';
  declare name: string;
  declare model_name: CreationOptional<string | null>;
  declare model_id: CreationOptional<number | null>;
  declare params: CreationOptional<any>;
  declare scheduled_for: CreationOptional<Date | null>;
  declare finished_at: CreationOptional<Date | null>;

  static associate(models: DatabaseModels) {
    Bulk.hasMany(models.Action, { foreignKey: 'bulk_id', as: 'bulks' });
  }
}

export function init(sequelize: Sequelize) {
  Bulk.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      creator_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      total_actions: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      total_fulfilled_actions: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
        defaultValue: 0,
      },
      total_failed_actions: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
        defaultValue: 0,
      },
      status: {
        allowNull: false,
        type: DataTypes.ENUM(
          'scheduled',
          'running',
          'finished',
          'stopped',
          'paused',
        ),
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      model_name: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      model_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      params: {
        allowNull: true,
        type: DataTypes.TEXT,
        get: function () {
          return JSON.parse(this.getDataValue('params') || '{}');
        },
        set: function (value) {
          this.setDataValue('params', JSON.stringify(value));
        },
      },
      scheduled_for: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      finished_at: {
        allowNull: true,
        type: DataTypes.DATE,
        defaultValue: null,
      },
    },
    {
      sequelize,
      tableName: 'global_bulks',
      modelName: 'Bulk',
      timestamps: true,
      paranoid: true,
      underscored: true,
      schema: config.get('index.sequelize.system.database'),
      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'id' }, { name: 'name' }, { name: 'status' }],
        },
      ],
    },
  );
  return Bulk;
}
