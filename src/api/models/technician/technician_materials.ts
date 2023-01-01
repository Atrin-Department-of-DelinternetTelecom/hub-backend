import { Model, DataTypes, CreationOptional, Sequelize } from 'sequelize';

export class TechnicianMaterial extends Model {
  declare id: CreationOptional<number>;
  declare title: string;
  declare unit: string | null;
  declare unitPrice: string | null;
}

export function init(sequelize: Sequelize) {
  TechnicianMaterial.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      unit: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      unitPrice: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      tableName: 'technician_materials',
      underscored: true,
      timestamps: true,
      paranoid: true,
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

  return TechnicianMaterial;
}
