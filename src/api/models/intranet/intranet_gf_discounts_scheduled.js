//@ts-check
'use strict';
const { DISCOUNT_SCHEDULED } = require('@api/constants/statuses');
const GfDiscountScheduledFields = require('@resources/intranet/fields/GfDiscountScheduled');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const GfDiscountsScheduled = sequelize.define(
    'GfDiscountsScheduled',
    new GfDiscountScheduledFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      tableName: 'gf_discounts_scheduled',
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

  GfDiscountsScheduled.associate = function (models) {
    GfDiscountsScheduled.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });
    GfDiscountsScheduled.belongsTo(models.GfDiscountsExecuted, {
      foreignKey: 'executedId',
      as: 'executed',
    });
  };

  GfDiscountsScheduled.prototype.isApplied = function () {
    return this.getDataValue('state') == DISCOUNT_SCHEDULED.APPLIED;
  };

  GfDiscountsScheduled.prototype.isPartialApplied = function () {
    return this.getDataValue('state') == DISCOUNT_SCHEDULED.PARTIALLY_APPLIED;
  };

  return GfDiscountsScheduled;
};
