//@ts-check
'use strict';
const GfDiscountMatrixFields = require('@resources/intranet/fields/GfDiscountMatrix');
const intranet = require('@utils/intranet');

const { Op } = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  const GfDiscountsMatrix = sequelize.define(
    'GfDiscountsMatrix',
    new GfDiscountMatrixFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      tableName: 'gf_discounts_matrix',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',

      defaultScope: { ...intranet.defaultScope },

      scopes: {
        active: {
          where: {
            active: 1,
          },
        },
        inactive: {
          where: {
            active: 0,
          },
        },
      },

      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'id' }],
        },
      ],
    },
  );

  GfDiscountsMatrix.associate = function (models) {
    GfDiscountsMatrix.belongsTo(models.GfFeeGroup, {
      foreignKey: 'feeGroupId',
      as: 'feeGroup',
    });

    GfDiscountsMatrix.hasMany(models.MatrixReplacementCombinationSet, {
      foreignKey: 'matrixId',
      as: 'combinationSets',
    });

    GfDiscountsMatrix.belongsTo(models.GfFeegroupsGroupLabel, {
      foreignKey: 'feeGroupLabelId',
      as: 'feeGroupLabels',
    });

    GfDiscountsMatrix.hasMany(models.GfDiscountsMatrixRule, {
      foreignKey: 'matrixId',
      as: 'matrixRule',
    });

    GfDiscountsMatrix.hasMany(models.GfDiscountsMatrixExclusion, {
      foreignKey: 'matrixId',
      as: 'matrixExclusion',
    });

    GfDiscountsMatrix.belongsTo(models.GfBonus, {
      foreignKey: 'bonoId',
      as: 'bonus',
    });
  };

  GfDiscountsMatrix.prototype.isActive = function () {
    return this.getDataValue('active') === 1;
  };

  GfDiscountsMatrix.prototype.forceExecution = function () {
    return this.getDataValue('forceExecutionTargetActivation') === 1;
  };

  /**
   * check if we exceed the maximum accumulation of this discount for this contract.
   *
   * @return boolean
   */
  GfDiscountsMatrix.prototype.reachedAccumulation = async function (
    contractId,
    ignoreExecutedId = [],
  ) {
    if (!this.accumulation) return false;

    const GfDiscountsExecuted = this.sequelize.models.GfDiscountsExecuted;
    const countExecuted = await GfDiscountsExecuted.scope(
      'active',
      'defaultScope',
    ).count({
      where: {
        targetContractId: contractId,
        matrixId: this.id,
        id: {
          [Op.notIn]: ignoreExecutedId,
        },
      },
    });

    return countExecuted >= this.accumulation;
  };

  return GfDiscountsMatrix;
};
