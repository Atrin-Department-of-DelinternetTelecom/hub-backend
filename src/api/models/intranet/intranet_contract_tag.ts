import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Sequelize } from 'sequelize';

import { get as config } from '@config';

export class ContractTag extends Model {
  declare id: number;
  declare name: Record<string, string>;
  declare comment_required: boolean;
  declare contract_tag_category_id: number;
  // relation ships
  declare ContractTagCategory: AnyModel;
  declare ContractTagMappings: AnyModel[];

  static associate(models: DatabaseModels) {
    ContractTag.belongsTo(models.ContractTagCategory);
    ContractTag.hasMany(models.ContractTagMapping);
  }
}

export function init(sequelize: Sequelize) {
  ContractTag.init(
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
      contract_tag_category_id: {
        allowNull: false,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      comment_required: {
        allowNull: false,
        defaultValue: false,
        type: DataTypes.BOOLEAN,
      },
      visible: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'ContractTag',
      schema: config('index.sequelize.intranet.database'),
      timestamps: false,
      underscored: true,
    },
  );

  return ContractTag;
}
