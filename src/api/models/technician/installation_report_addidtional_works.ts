import { DatabaseModels } from '@models';
import { Model, DataTypes, CreationOptional, Sequelize } from 'sequelize';
import type { TechnicianAdditionalWork } from './technician_additional_works';

export class InstallationReportAdditionalWork extends Model {
  declare id: CreationOptional<number>;
  declare reportId: number;
  declare amount: number;
  declare additionalWork?: TechnicianAdditionalWork;

  static associate(models: DatabaseModels) {
    this.belongsTo(models.TechnicianAdditionalWork, {
      foreignKey: 'additionalWorkId',
      as: 'additionalWork',
    });
  }
}

export function init(sequelize: Sequelize) {
  InstallationReportAdditionalWork.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      reportId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      additionalWorkId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'installation_report_additional_works',
      underscored: true,
      timestamps: false,
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

  return InstallationReportAdditionalWork;
}
