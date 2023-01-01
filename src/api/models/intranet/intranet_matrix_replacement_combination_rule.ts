// Discount_Replacement_Combination_Details.ts
import { DataTypes, Model, Sequelize, Op } from 'sequelize';
import intranet from '@utils/intranet';
import { AnyModel, DatabaseModels } from '@models';
import { get as config } from '@config';

class MatrixReplacementCombinationRule extends Model {
  declare id: number;
  declare combinationsetId: number;
  declare matrixId: number;
  declare priority: number | null;
  declare status: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare combinationSet: AnyModel;

  static associate(models: any) {
    MatrixReplacementCombinationRule.belongsTo(
      models.MatrixReplacementCombinationSet,
      {
        foreignKey: 'combinationSetId',
        as: 'combinationSet',
      },
    );

    MatrixReplacementCombinationRule.belongsTo(models.GfDiscountsMatrix, {
      foreignKey: 'matrixId',
      as: 'matrix',
    });
  }
}

export function init(sequelize: Sequelize) {
  MatrixReplacementCombinationRule.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      combinationSetId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      matrixId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      priority: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: true,
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
      tableName: 'matrix_replacement_combination_rules',
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

  return MatrixReplacementCombinationRule;
}
