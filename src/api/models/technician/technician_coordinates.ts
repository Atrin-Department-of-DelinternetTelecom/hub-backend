import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Sequelize,
} from 'sequelize';

import type { DatabaseModels } from '@models';
import type { TechnicianStep } from './technician_steps';
import type { TechnicianTask } from './technician_tasks';

export type TaskState =
  | 'pending'
  | 'in_progress'
  | 'done'
  | 'cancelled'
  | 're_schedule';

export class TechnicianCoordinate extends Model<
  InferAttributes<TechnicianCoordinate>,
  InferCreationAttributes<TechnicianCoordinate>
> {
  declare id: CreationOptional<number>;
  declare state: TaskState;
  declare technicianTaskId: number;
  declare technicianStepId: number | null;
  declare lat: number;
  declare lng: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  protected declare task: NonAttribute<TechnicianTask>;
  protected declare step: NonAttribute<TechnicianStep>;

  static associate(models: DatabaseModels) {
    TechnicianCoordinate.belongsTo(models.TechnicianTask, {
      as: 'task',
      foreignKey: 'technicianTaskId',
    });
    TechnicianCoordinate.belongsTo(models.TechnicianStep, {
      as: 'step',
      foreignKey: 'technicianStepId',
    });
  }
}

export function init(sequelize: Sequelize) {
  TechnicianCoordinate.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      state: {
        type: DataTypes.ENUM('pending', 'in_progress', 'done', 'cancelled'),
        allowNull: false,
      },
      technicianTaskId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      technicianStepId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      lat: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: false,
        get() {
          return Number(this.getDataValue('lat'));
        },
      },
      lng: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: false,
        get() {
          return Number(this.getDataValue('lng'));
        },
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
      tableName: 'technician_coordinates',
      timestamps: true,
      underscored: true,
    },
  );

  return TechnicianCoordinate;
}
