//@ts-check
'use strict';
const GfFeeGroupLabelFields = require('@resources/intranet/fields/GfFeeGroupLabel');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const gfFeegroupsLabel = sequelize.define(
    'GfFeegroupsLabel',
    new GfFeeGroupLabelFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      tableName: 'gf_feegroups_labels',
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

  gfFeegroupsLabel.associate = function (models) {
    gfFeegroupsLabel.hasMany(models.GfFeegroupsLabelsXref, {
      foreignKey: 'labelId',
      as: 'fee_groups',
    });

    gfFeegroupsLabel.hasMany(models.GfDiscountsMatrixRule, {
      foreignKey: 'presentLabelId',
      as: 'matrixRule',
    });

    // gfFeegroupsLabel.belongsToMany(models.GfFeeGroup, {
    //   through: {
    //     model: models.GfFeegroupsLabelsXref,
    //     scope: _.get(intranet, 'defaultScope.where', {}),
    //   },
    //   foreignKey: 'labelId',
    //   otherKey: 'feeGroupId',
    //   as: 'feeGroups'
    // });

    gfFeegroupsLabel.hasMany(models.GfFeegroupsLabelsXref, {
      foreignKey: 'labelId',
      as: 'xrefs',
    });
  };

  return gfFeegroupsLabel;
};
