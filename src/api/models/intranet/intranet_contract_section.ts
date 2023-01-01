import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Op, Sequelize } from 'sequelize';

import _ from 'lodash';
import intranet from '@utils/intranet';

export class GfContractSection extends Model {
  static associate(models: DatabaseModels) {}
}

export function init(sequelize: Sequelize) {
  GfContractSection.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      sectionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      sectionName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'GfContractSection',
      tableName: 'gf_contract_gf_section',
      schema: 'intranet',
      timestamps: false,
    },
  );

  return GfContractSection;
}
