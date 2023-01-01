import { CreationOptional, DataTypes, Model, Sequelize } from 'sequelize';

import { DatabaseModels } from '..';

const STEP_STATE = ['pending', 'in_progress', 'done', 'error'] as const;

export type StepState = (typeof STEP_STATE)[number];

export class TechnicianStep extends Model {
  declare id: CreationOptional<number>;
  declare name: string;
  declare state: StepState;
  declare error?: string;
  declare media: string[];

  static associate(models: DatabaseModels) {
    TechnicianStep.hasOne(models.TechnicianCoordinate, {
      as: 'coordinate',
      foreignKey: 'technicianStepId',
    });
  }
}

export function init(sequelize: Sequelize) {
  TechnicianStep.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      taskId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      index: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      state: {
        type: DataTypes.ENUM(...STEP_STATE),
        allowNull: false,
        defaultValue: 'pending',
      },
      error: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      media: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          return JSON.parse(this.getDataValue('media') || '[]');
        },
        set(value: string[]) {
          this.setDataValue('media', JSON.stringify(value));
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
      tableName: 'technician_steps',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'id' }],
        },
        {
          name: 'REFERENCE',
          unique: false,
          using: 'BTREE',
          fields: [{ name: 'taskId' }],
        },
      ],
    },
  );

  return TechnicianStep;
}
