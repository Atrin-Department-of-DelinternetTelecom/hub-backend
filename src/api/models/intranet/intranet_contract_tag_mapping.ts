import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Sequelize } from 'sequelize';

import { get as config } from '@config';

export class ContractTagMapping extends Model {
  declare id: number;
  declare name: Record<string, string>;
  // relation ships
  declare ContractTag: AnyModel[];

  static associate(models: DatabaseModels) {
    ContractTagMapping.belongsTo(models.ContractTag);
    ContractTagMapping.belongsTo(models.GfContract);
  }
}

export function init(sequelize: Sequelize) {
  ContractTagMapping.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      contract_tag_id: {
        allowNull: false,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      gf_contract_id: {
        allowNull: false,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      comment: {
        allowNull: true,
        type: DataTypes.TEXT,
        defaultValue: null,
      },
    },
    {
      sequelize,
      modelName: 'ContractTagMapping',
      tableName: 'contract_tag_mappings',
      schema: config('index.sequelize.intranet.database'),
      timestamps: false,
      underscored: true,
    },
  );

  return ContractTagMapping;
}
