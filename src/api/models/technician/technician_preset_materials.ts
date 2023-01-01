import { DatabaseModels } from '@models';
import { Model, DataTypes, CreationOptional, Sequelize } from 'sequelize';
import type { TechnicianMaterial } from './technician_materials';

export class TechnicianPresetMaterials extends Model {
  declare id: CreationOptional<number>;
  declare amount: number;
  declare materialId: number;
  declare material?: TechnicianMaterial;

  static associate(models: DatabaseModels) {
    this.belongsTo(models.TechnicianMaterial, {
      foreignKey: 'materialId',
      as: 'material',
    });
  }
}

export function init(sequelize: Sequelize) {
  TechnicianPresetMaterials.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      presetId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      materialId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'technician_preset_materials',
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

  return TechnicianPresetMaterials;
}
