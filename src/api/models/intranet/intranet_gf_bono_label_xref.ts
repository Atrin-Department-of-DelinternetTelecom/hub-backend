import { DatabaseModels } from '@models';
import { DataTypes, Model, Op, Sequelize } from 'sequelize';
import config from '@config';

import _ from 'lodash';

export class GfBonoLabelXref extends Model {
  declare id: number;
  declare labelId: number;
  declare bonoId: number;
  declare status: boolean;
  declare creationDate: Date;
  declare updateDate: Date;

  static associate(models: DatabaseModels) {}
}

export function init(sequelize: Sequelize) {
  GfBonoLabelXref.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      labelId: {
        type: DataTypes.NUMBER,
        allowNull: false,
      },
      bonoId: {
        type: DataTypes.NUMBER,
        allowNull: false,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'GfBonoLabelXref',
      tableName: 'gf_bono_labels_xref',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: {
        where: {
          status: {
            [Op.not]: config.get('index.intranet.deleteStatus'),
          },
        },
      },
    },
  );

  return GfBonoLabelXref;
}
