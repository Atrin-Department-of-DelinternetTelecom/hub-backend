//@ts-check
'use strict';
const GfBonusFeeGroupXrefFields = require('@resources/intranet/fields/GfBonusFeeGroupXref');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const GfBonusFeegroupsXref = sequelize.define(
    'GfBonusFeegroupsXref',
    new GfBonusFeeGroupXrefFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      tableName: 'gf_bonus_feegroups_xref',
      modelName: 'GfBonusFeegroupsXref',
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

  GfBonusFeegroupsXref.associate = function (models) {
    GfBonusFeegroupsXref.belongsTo(models.GfBonus, {
      foreignKey: 'bonusId',
      as: 'gf_bonus',
    });
    GfBonusFeegroupsXref.belongsTo(models.GfFeeGroup, {
      foreignKey: 'feeGroupId',
      as: 'feeGroup',
    });
  };

  return GfBonusFeegroupsXref;
};
