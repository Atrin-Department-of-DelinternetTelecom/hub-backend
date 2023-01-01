import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Sequelize, Op } from 'sequelize';
import intranet from '@utils/intranet';
import { get as config } from '@config';

class MatrixReplacementCombinationSet extends Model {
  declare id: number;
  declare matrixId: number;
  declare status: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  static associate(models: any) {
    MatrixReplacementCombinationSet.hasMany(
      models.MatrixReplacementCombinationRule,
      {
        foreignKey: 'combinationSetId',
        as: 'combinationSetRules',
      },
    );
    MatrixReplacementCombinationSet.belongsTo(models.GfDiscountsMatrix, {
      foreignKey: 'matrixId',
      as: 'matrix',
    });
  }
}
export function init(sequelize: Sequelize) {
  MatrixReplacementCombinationSet.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      matrixId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
      },
      creationDate: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updateDate: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      tableName: 'matrix_replacement_combination_sets',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: {
        where: {
          status: {
            [Op.not]: config('index.intranet.deleteStatus'),
          },
        },
      },
    },
  );
  return MatrixReplacementCombinationSet;
}
