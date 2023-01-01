'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
const _ = require('lodash');
module.exports = function (sequelize, DataTypes) {
  const GfDiscountsExecutedUsage = sequelize.define(
    'GfDiscountsExecutedUsage',
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
      type: {
        type: DataTypes.ENUM('contract', 'matrix', 'contract-bono'),
        allowNull: true,
        defaultValue: 'contract',
      },
      typeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      typeInfo: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      executedId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      ruleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      tableName: 'gf_discounts_executed_usages',
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

  GfDiscountsExecutedUsage.associate = function (models) {
    GfDiscountsExecutedUsage.belongsTo(models.GfDiscountsExecuted, {
      foreignKey: 'executedId',
      as: 'executed',
    });

    GfDiscountsExecutedUsage.belongsTo(models.GfDiscountsMatrixRule, {
      foreignKey: 'ruleId',
      as: 'rule',
    });

    GfDiscountsExecutedUsage.belongsTo(models.GfContract, {
      foreignKey: 'typeId',
      as: 'contract',
    });

    GfDiscountsExecutedUsage.belongsTo(models.GfBonusContractXref, {
      foreignKey: 'typeId',
      as: 'bono_xref',
    });
  };

  GfDiscountsExecutedUsage.prototype.isActive = function () {
    return this.getDataValue('active') == 1;
  };

  GfDiscountsExecutedUsage.addHook('afterFind', async (usages, query) => {
    if (!usages) return;

    if (!Array.isArray(usages)) usages = [usages];

    for (const usage of usages) {
      if (usage.type === 'contract') {
        usage.typeInfo = usage.contract;
      } else if (usage.type === 'contract-bono') {
        usage.typeInfo = usage.bono_xref;
      } else if (usage.type === 'matrix') {
        usage.typeInfo = usage.matrix;
      }
    }
  });

  return GfDiscountsExecutedUsage;
};
