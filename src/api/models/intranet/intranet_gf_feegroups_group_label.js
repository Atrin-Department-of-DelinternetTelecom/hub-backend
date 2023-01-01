//@ts-check
'use strict';
const GfFeeGroupGroupLabelFields = require('@resources/intranet/fields/GfFeeGroupGroupLabel');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const gfFeegroupsGroupLabel = sequelize.define(
    'GfFeegroupsGroupLabel',
    new GfFeeGroupGroupLabelFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      tableName: 'gf_feegroups_group_label',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: {
        ...intranet.defaultScope,
      },
      schema: 'intranet',
      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [
            {
              name: 'id',
            },
          ],
        },
        {
          name: 'status',
          using: 'BTREE',
          fields: [
            {
              name: 'status',
            },
          ],
        },
        {
          name: 'uid',
          using: 'BTREE',
          fields: [
            {
              name: 'uid',
            },
          ],
        },
      ],
    },
  );

  gfFeegroupsGroupLabel.associate = function (models) {
    gfFeegroupsGroupLabel.hasMany(models.GfFeegroupsGroupLabelsXref, {
      foreignKey: 'labelId',
      as: 'fee_groups_label',
    });

    gfFeegroupsGroupLabel.hasMany(models.GfDiscountsMatrix, {
      foreignKey: 'feeGroupLabelId',
      as: 'discountMatrix',
    });

    gfFeegroupsGroupLabel.belongsToMany(models.GfFeeGroup, {
      through: {
        model: models.GfFeegroupsGroupLabelsXref,
        scope: intranet.defaultScope.where,
      },
      foreignKey: 'labelId',
      otherKey: 'feeGroupId',
      as: 'feeGroups',
    });
  };

  return gfFeegroupsGroupLabel;
};
