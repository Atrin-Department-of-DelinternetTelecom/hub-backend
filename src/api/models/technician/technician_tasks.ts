import type { AnyModel, DatabaseModels } from '@models';
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Sequelize,
} from 'sequelize';

import { InstallationReport } from './installation_reports';
import type { TechnicianCoordinate } from './technician_coordinates';
import type { TechnicianStep } from './technician_steps';

export type TaskState =
  | 'pending'
  | 'in_progress'
  | 'done'
  | 'cancelled'
  | 're_schedule';
export type CancelledBy =
  | 'operator'
  | 'technician'
  | 'timeout'
  | 're_schedule'
  | 'system';

export class TechnicianTask extends Model<
  InferAttributes<TechnicianTask>,
  InferCreationAttributes<TechnicianTask>
> {
  declare id: CreationOptional<number>;
  declare type: string;
  declare typeId: number;
  declare state: TaskState;
  declare scheduledDate: Date;
  declare cancelledBy: CancelledBy | null;
  declare cancelReasonId: number | null;
  declare cancelReasonDescription: string | null;
  declare technicianUserId: number;
  declare cancelledById: number | null;
  declare gfClientId: number;
  declare gfContractId: number | null;
  declare startedAt: CreationOptional<Date | null>;
  declare finishedAt: CreationOptional<Date | null>;
  declare autoCloseAt: CreationOptional<Date | null>;
  declare cancelledAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare technician?: NonAttribute<any>;
  declare client?: NonAttribute<any>;
  declare cancelReason?: NonAttribute<any>;
  declare contract?: NonAttribute<any>;
  declare cancelledByUser?: NonAttribute<any>;
  declare installationReport?: NonAttribute<InstallationReport>;
  declare coWorkers?: NonAttribute<any>;
  declare coordinates: NonAttribute<TechnicianCoordinate[]>;
  protected declare steps?: NonAttribute<TechnicianStep[]>;

  getSteps() {
    if (this.steps) return this.steps;
    throw new Error('steps are not included in the query');
  }

  static associate(models: DatabaseModels) {
    TechnicianTask.hasMany(models.TechnicianStep, {
      as: 'steps',
      foreignKey: 'taskId',
    });

    TechnicianTask.hasMany(models.TechnicianCoordinate, {
      as: 'coordinates',
      foreignKey: 'technicianTaskId',
    });

    TechnicianTask.hasOne(models.InstallationReport, {
      as: 'installationReport',
      foreignKey: 'taskId',
    });

    TechnicianTask.belongsTo(models.GfClient, {
      as: 'client',
      foreignKey: 'gfClientId',
    });

    TechnicianTask.belongsTo(models.GfContract, {
      as: 'contract',
      foreignKey: 'gfContractId',
    });

    TechnicianTask.belongsTo(models.User, {
      as: 'cancelledByUser',
      foreignKey: 'cancelledById',
    });

    TechnicianTask.belongsTo(models.User, {
      as: 'technician',
      foreignKey: 'technicianUserId',
    });

    TechnicianTask.belongsTo(models.TechnicianCancelReason, {
      as: 'cancelReason',
      foreignKey: 'cancelReasonId',
    });
  }
}

export function init(sequelize: Sequelize) {
  TechnicianTask.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      type: {
        type: DataTypes.STRING(255), // full type of installation (type + sub-type)
        allowNull: false,
      },
      typeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      state: {
        type: DataTypes.ENUM('pending', 'in_progress', 'done', 'cancelled'),
        allowNull: false,
      },
      scheduledDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      cancelledById: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      finishedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      autoCloseAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      cancelledBy: {
        type: DataTypes.ENUM(
          'operator',
          'technician',
          'timeout',
          're_schedule',
        ),
        allowNull: true,
      },
      cancelReasonId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      cancelReasonDescription: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      technicianUserId: {
        // system global user id
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      gfClientId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      gfContractId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      cancelledAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
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
      tableName: 'technician_tasks',
      timestamps: true,
      underscored: true,
      paranoid: true,
    },
  );

  return TechnicianTask;
}
