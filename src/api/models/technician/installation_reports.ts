'use strict';

import type { AnyModel, DatabaseModels } from '@models';
import { CreationOptional, DataTypes, Model, Sequelize } from 'sequelize';
import { User } from '../global/global_users';
import { InstallationReportAdditionalWork } from './installation_report_addidtional_works';
import { InstallationReportMaterial } from './installation_report_materials';
import type { TechnicianTask } from './technician_tasks';

export class InstallationReport extends Model {
  declare id: CreationOptional<number>;
  declare taskId: number;
  declare docId: string;
  declare clientName: string;
  declare clientPhone: string;
  declare clientEmail: string;
  declare technicianName: string;
  declare address: string;
  declare city: string;
  declare isAssistance: boolean;
  declare clientObservation: string | null;
  declare technicianObservation: string | null;
  declare description: string | null;
  declare operatorDescription: string | null;
  declare elapsedTime: number;
  declare operationalCost: string | null;
  declare customOperationalCost: string | null;
  declare materialCost: string | null;
  declare customMaterialCost: string | null;
  declare subTotalCost: string | null;
  declare taxRate: string | null;
  declare totalCost: string | null;
  declare discountId: number | null;
  declare chargeId: number | null;
  declare reviewStatus: 'pending' | 'accepted' | 'rejected';
  declare reviewedById: number | null;
  declare createdAt: CreationOptional<Date>;

  declare additionalWorks?: InstallationReportAdditionalWork[];
  declare materials: InstallationReportMaterial[];
  declare task: TechnicianTask;
  declare discount?: AnyModel;
  declare charge?: AnyModel;
  declare reviewedBy?: User | null;

  static associate(models: DatabaseModels) {
    this.hasMany(models.InstallationReportMaterial, {
      as: 'materials',
      foreignKey: 'reportId',
      onDelete: 'CASCADE',
    });
    this.hasMany(models.InstallationReportAdditionalWork, {
      as: 'additionalWorks',
      foreignKey: 'reportId',
      onDelete: 'CASCADE',
    });
    this.belongsTo(models.GfDiscountsScheduled, {
      as: 'discount',
      foreignKey: 'discountId',
    });
    this.belongsTo(models.GfDiscountsScheduled, {
      as: 'charge',
      foreignKey: 'chargeId',
    });
    this.belongsTo(models.TechnicianTask, {
      as: 'task',
      foreignKey: 'taskId',
    });
    this.belongsTo(models.User, {
      as: 'reviewedBy',
      foreignKey: 'reviewedById',
    });
  }
}

export function init(sequelize: Sequelize) {
  InstallationReport.init(
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
      docId: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      clientName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      clientPhone: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      clientEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      technicianName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      isAssistance: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      operatorDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      elapsedTime: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      operationalCost: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      customOperationalCost: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      materialCost: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      customMaterialCost: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      subTotalCost: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      taxRate: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      totalCost: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      reviewStatus: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
        defaultValue: 'pending',
        allowNull: false,
      },
      reviewedById: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      discountId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      chargeId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      clientObservation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      technicianObservation: {
        type: DataTypes.TEXT,
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
      tableName: 'installation_reports',
      timestamps: true,
      underscored: true,
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

  return InstallationReport;
}
