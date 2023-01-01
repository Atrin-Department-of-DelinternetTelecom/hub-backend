import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Sequelize } from 'sequelize';

import { get as config } from '@config';
import { defaultScope } from '@utils/intranet';

export class Country extends Model {
  declare id: number;
  declare isoCode: string;
  declare name: string;
  declare currencyCode: string;
  declare uid: number;
  declare status: number;
  declare creationDate: string;
  declare updateDate: string;
  // relation ships
  declare invoices: AnyModel[];
  declare invoiceClient: AnyModel[];

  toSearchableObject() {
    return {
      id: this.id,
      isoCode: this.isoCode,
      currencyCode: this.currencyCode,
      name: this.name,
    };
  }

  static associate(models: DatabaseModels) {}
}

export function init(sequelize: Sequelize) {
  Country.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      isoCode: {
        type: DataTypes.STRING(3),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [2, 4],
        },
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      currencyCode: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      uid: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: config('index.intranet.uid'),
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        set(value) {
          this.setDataValue('status', Number(value));
        },
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'global_countries',
      schema: config('index.sequelize.intranet.database'),
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope,

      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'id' }],
        },
        {
          name: 'isoCode',
          using: 'BTREE',
          fields: [{ name: 'isoCode' }],
        },
        {
          name: 'status',
          using: 'BTREE',
          fields: [{ name: 'status' }],
        },
        {
          name: 'uid',
          using: 'BTREE',
          fields: [{ name: 'uid' }],
        },
      ],
    },
  );

  return Country;
}
