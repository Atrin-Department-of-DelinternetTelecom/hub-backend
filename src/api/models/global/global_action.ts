import { Model, DataTypes, Sequelize, CreationOptional } from 'sequelize';
import config from '@config';
import { DatabaseModels } from '@models';

export class Action extends Model {
  declare id: CreationOptional<number>;
  declare bulk_id: number;
  declare name: string;
  declare model_name: CreationOptional<string | null>;
  declare model_id: CreationOptional<number | null>;
  declare params: CreationOptional<any | null>;
  declare pre: CreationOptional<any | null>;
  declare post: CreationOptional<any | null>;
  declare result: CreationOptional<any | null>;
  declare status: CreationOptional<
    'in-queue' | 'pending' | 'fulfilled' | 'failed'
  >;
  declare remaining_retry_count: CreationOptional<number>;
  declare error: CreationOptional<string | null>;

  static associate(models: DatabaseModels) {
    Action.belongsTo(models.Bulk, { foreignKey: 'bulk_id', as: 'bulks' });
    Action.belongsTo(models.UnpaidChangeFeeNotification, {
      foreignKey: 'model_id',
      constraints: false,
    });
  }
}

export function init(sequelize: Sequelize) {
  Action.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      bulk_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
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
      pre: {
        allowNull: true,
        type: DataTypes.TEXT,
        get: function () {
          return JSON.parse(this.getDataValue('pre') || '{}');
        },
        set: function (value) {
          this.setDataValue('pre', JSON.stringify(value));
        },
      },
      post: {
        allowNull: true,
        type: DataTypes.TEXT,
        get: function () {
          return JSON.parse(this.getDataValue('post') || '{}');
        },
        set: function (value) {
          this.setDataValue('post', JSON.stringify(value));
        },
      },
      result: {
        allowNull: true,
        type: DataTypes.TEXT,
        get: function () {
          return JSON.parse(this.getDataValue('result') || '{}');
        },
        set: function (value) {
          this.setDataValue('result', JSON.stringify(value));
        },
      },
      status: {
        allowNull: false,
        type: DataTypes.ENUM('in-queue', 'pending', 'fulfilled', 'failed'),
        defaultValue: 'in-queue',
      },
      remaining_retry_count: {
        allowNull: false,
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      error: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      tableName: 'global_actions',
      modelName: 'Action',
      timestamps: true,
      paranoid: true,
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
  return Action;
}
