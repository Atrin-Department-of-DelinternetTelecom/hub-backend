import { DatabaseModels } from '@models';
import { Model, DataTypes, CreationOptional, Sequelize } from 'sequelize';
import { TechnicianPresetMaterials } from './technician_preset_materials';

export class TechnicianPreset extends Model {
  declare id: CreationOptional<number>;
  declare name: string;
  declare materials?: TechnicianPresetMaterials[];

  static associate(models: DatabaseModels) {
    this.hasMany(models.TechnicianPresetMaterials, {
      foreignKey: 'presetId',
      as: 'materials',
    });
  }
}

export function init(sequelize: Sequelize) {
  TechnicianPreset.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      forTaskType: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'technician_presets',
      underscored: true,
      timestamps: true,
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

  return TechnicianPreset;
}
