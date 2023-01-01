import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Sequelize } from 'sequelize';

import { get as config } from '@config';

export class ContractTagCategory extends Model {
  declare id: number;
  declare name: Record<string, string>;
  // relation ships
  declare ContractTag: AnyModel[];

  static associate(models: DatabaseModels) {
    ContractTagCategory.hasMany(models.ContractTag);
  }
}

export function init(sequelize: Sequelize) {
  ContractTagCategory.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      name: {
        allowNull: false,
        type: DataTypes.TEXT,
        get() {
          return JSON.parse(this.getDataValue('name'));
        },
        set(value) {
          this.setDataValue('name', JSON.stringify(value));
        },
      },
      visible: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'ContractTagCategory',
      schema: config('index.sequelize.intranet.database'),
      timestamps: false,
      underscored: true,
    },
  );

  return ContractTagCategory;
}
