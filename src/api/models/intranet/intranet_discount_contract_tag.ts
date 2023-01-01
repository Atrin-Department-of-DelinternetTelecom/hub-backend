import { DatabaseModels } from '@models';
import { DataTypes, Model, Op, Sequelize, literal } from 'sequelize';

import _ from 'lodash';
import { intranet as knex } from '@lib/knex';

export class DiscountContractTag extends Model {
  declare id: number;
  declare contractId: number;
  declare tagId: number;
  declare executedId: number;
  declare tagName: string;
  static searchTags: any;

  static associate(models: DatabaseModels) {}
}

export function init(sequelize: Sequelize) {
  DiscountContractTag.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      targetContractId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      executedId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tagId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        allowNull: false,
        field: 'tag_name',
        type: DataTypes.TEXT,
        get() {
          return JSON.parse(this.getDataValue('name'));
        },
      },
    },
    {
      sequelize,
      modelName: 'DiscountContractTag',
      tableName: 'discount_contract_tag_view',
      schema: 'intranet',
      timestamps: false,
      underscored: true,
    },
  );

  DiscountContractTag.searchTags = (value: string) => {
    const tags = Array.isArray(value) ? value : value.split(',');
    const ref = `ct${Date.now()}`;
    const subQuery = knex(`intranet.contract_tag_mappings AS ${ref}`)
      .select(1)
      .whereIn(`${ref}.contract_tag_id`, tags)
      .andWhere(`${ref}.gf_contract_id`, knex.raw('GfContract.id'))
      .limit(1)
      .toQuery();

    return {
      key: Op.and,
      where: literal(`EXISTS (${subQuery})`),
    };
  };

  return DiscountContractTag;
}
