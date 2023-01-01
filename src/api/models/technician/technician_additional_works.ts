import { Model, DataTypes, CreationOptional, Sequelize } from 'sequelize';

export class TechnicianAdditionalWork extends Model {
  declare id: CreationOptional<number>;
  declare title: string;
  declare unit: string | null;
}

export function init(sequelize: Sequelize) {
  TechnicianAdditionalWork.init(
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
      tableName: 'technician_additional_works',
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

  return TechnicianAdditionalWork;
}
