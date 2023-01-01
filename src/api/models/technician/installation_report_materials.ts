import { DatabaseModels } from '@models';
import { Model, DataTypes, CreationOptional, Sequelize } from 'sequelize';
import type { TechnicianMaterial } from './technician_materials';

export class InstallationReportMaterial extends Model {
  declare id: CreationOptional<number>;
  declare reportId: number;
  declare materialId: number;
  declare amount: number;
  declare material?: TechnicianMaterial;
  declare unitPrice: string | null;
  declare totalPrice: string | null;

  static associate(models: DatabaseModels) {
    this.belongsTo(models.TechnicianMaterial, {
      foreignKey: 'materialId',
      as: 'material',
    });
  }
}

export function init(sequelize: Sequelize) {
  InstallationReportMaterial.init(
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
      materialId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      unitPrice: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      totalPrice: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'installation_report_materials',
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

  return InstallationReportMaterial;
}
