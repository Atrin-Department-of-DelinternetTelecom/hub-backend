'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
const _ = require('lodash');
module.exports = function (sequelize, DataTypes) {
  const GfDiscountsExecuted = sequelize.define(
    'GfDiscountsExecuted',
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
      targetContractId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      matrixId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      init: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      end: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      active: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      combinationExecutedTask: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
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
      tableName: 'gf_discounts_executed',
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
        all: {
          status: [0, 1],
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

  GfDiscountsExecuted.associate = function (models) {
    GfDiscountsExecuted.belongsTo(models.GfContract, {
      foreignKey: 'targetContractId',
      as: 'contract',
    });

    GfDiscountsExecuted.belongsTo(models.GfDiscountsMatrix, {
      foreignKey: 'matrixId',
      as: 'matrix',
    });

    GfDiscountsExecuted.hasMany(models.GfDiscountsExecutedUsage, {
      foreignKey: 'executedId',
      as: 'usages',
    });

    GfDiscountsExecuted.hasMany(models.DiscountContractTag, {
      foreignKey: 'executedId',
      as: 'tags',
    });

    GfDiscountsExecuted.hasOne(models.DiscountClientInfo, {
      foreignKey: 'executedId',
      as: 'clientInfo',
    });
  };

  GfDiscountsExecuted.prototype.isActive = function () {
    return this.getDataValue('active') == 1;
  };

  return GfDiscountsExecuted;
};
