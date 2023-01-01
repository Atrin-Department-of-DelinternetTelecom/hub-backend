'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
const _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
  const GfDiscountsMatrixRule = sequelize.define(
    'GfDiscountsMatrixRule',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      uid: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: config.get('index.intranet.uid'),
      },
      matrixId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      type: {
        type: DataTypes.ENUM(
          'labeled_contract_present',
          'discount_present',
          'labeled_contract_bono_present',
        ),
        allowNull: true,
        defaultValue: 'discount_present',
      },
      presentLabelId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      presentLabel: {
        type: DataTypes.VIRTUAL,
      },
      presentMatrixId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      maxDaysExists: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      maxDaysTargetExists: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      excludeFromFeeChange: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'gf_discounts_matrix_rules',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',

      defaultScope: { ...intranet.defaultScope },

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

  GfDiscountsMatrixRule.associate = function (models) {
    GfDiscountsMatrixRule.belongsTo(models.GfDiscountsMatrix, {
      foreignKey: 'matrixId',
      as: 'matrix',
    });

    GfDiscountsMatrixRule.belongsTo(models.GfDiscountsMatrix, {
      foreignKey: 'presentMatrixId',
      as: 'presentMatrix',
    });

    GfDiscountsMatrixRule.belongsTo(models.GfFeegroupsLabel, {
      foreignKey: 'presentLabelId',
      constraints: false,
      as: 'feegroupsLabel',
    });

    GfDiscountsMatrixRule.belongsTo(models.GfBonoLabel, {
      foreignKey: 'presentLabelId',
      constraints: false,
      as: 'bonoLabel',
    });
  };

  GfDiscountsMatrixRule.addHook('afterFind', async (rules, query) => {
    if (!rules) return;

    if (!Array.isArray(rules)) rules = [rules];

    for (const rule of rules) {
      if (rule.type === 'labeled_contract_bono_present') {
        rule.presentLabel = rule.bonoLabel;
      } else if (rule.type === 'labeled_contract_present') {
        rule.presentLabel = rule.feegroupsLabel;
      }
    }
  });

  return GfDiscountsMatrixRule;
};
