//@ts-check
'use strict';
const GfFeeGroupLabelXrefFields = require('@resources/intranet/fields/GfFeeGroupLabelXref');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const gfFeegroupsLabelsXref = sequelize.define(
    'GfFeegroupsLabelsXref',
    new GfFeeGroupLabelXrefFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      tableName: 'gf_feegroups_labels_xref',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',

      defaultScope: {
        ...intranet.defaultScope,
      },

      scopes: {},

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
          name: 'feeGroupId',
          using: 'BTREE',
          fields: [
            {
              name: 'feeGroupId',
            },
          ],
        },
        {
          name: 'labelId',
          using: 'BTREE',
          fields: [
            {
              name: 'labelId',
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

  gfFeegroupsLabelsXref.associate = function (models) {
    gfFeegroupsLabelsXref.belongsTo(models.GfFeegroupsLabel, {
      foreignKey: 'labelId',
      as: 'label',
    });
    gfFeegroupsLabelsXref.belongsTo(models.GfFeeGroup, {
      foreignKey: 'feeGroupId',
      as: 'feeGroup',
    });
  };

  return gfFeegroupsLabelsXref;
};
