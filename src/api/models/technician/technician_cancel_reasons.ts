import { CreationOptional, DataTypes, Model, Sequelize } from 'sequelize';

import { firstPopulated } from '@api/utils/helpers';

export class TechnicianCancelReason extends Model {
  declare id: CreationOptional<number>;
  declare name: string;
  declare category: string;
}

export function init(sequelize: Sequelize) {
  TechnicianCancelReason.init(
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
      category: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: '*',
      },
      commentRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      label: {
        type: DataTypes.TEXT,
        allowNull: false,
        set(value: Record<string, string>) {
          this.setDataValue(
            'label',
            JSON.stringify({
              en: null,
              es: null,
              ca: null,
              ...(typeof value === 'object'
                ? value
                : JSON.parse(value || '[]')),
            }),
          );
        },
        get() {
          return JSON.parse(
            firstPopulated([
              this.getDataValue('label'),
              JSON.stringify({ en: null, es: null, ca: null }),
            ]),
          );
        },
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
      tableName: 'technician_cancel_reasons',
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

  return TechnicianCancelReason;
}
