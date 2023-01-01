import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Op, Sequelize } from 'sequelize';
import config from '@config';

import _ from 'lodash';
import intranet from '@utils/intranet';

export class GfBonoLabel extends Model {
  declare id: number;
  declare name: string;
  declare status: boolean;
  declare creationDate: Date;
  declare updateDate: Date;

  static associate(models: DatabaseModels) {
    GfBonoLabel.belongsToMany(models.GfBonus, {
      through: {
        model: models.GfBonoLabelXref,
        scope: {
          status: {
            [Op.not]: config.get('index.intranet.deleteStatus'),
          },
        },
      },
      foreignKey: 'labelId',
      otherKey: 'bonoId',
      as: 'bonuses',
    });
  }
}

export function init(sequelize: Sequelize) {
  GfBonoLabel.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
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
      modelName: 'GfBonoLabel',
      tableName: 'gf_bono_labels',
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

  return GfBonoLabel;
}
