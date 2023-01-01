'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const GfFixCallTypesFields = require('@resources/intranet/fields/GfFixCallTypes');

const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const gfFixCallTypes = sequelize.define(
    'GfFixCallTypes',
    new GfFixCallTypesFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      tableName: 'gf_fix_call_types',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: {
        ...intranet.defaultScope,
      },
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

  gfFixCallTypes.associate = function (models) {
    gfFixCallTypes.hasMany(models.GfPhonePrefixGroups, {
      foreignKey: 'fixCallTypeId',
      as: 'gf_phone_prefix_groups',
    });

    gfFixCallTypes.belongsToMany(models.GfPhonePrefix, {
      through: {
        model: models.GfPhonePrefixGroupsXref,
        scope: intranet.defaultScope.where,
      },
      foreignKey: 'fixCallTypeId',
      otherKey: 'prefixCode',
      targetKey: 'code',
      as: 'prefixes',
    });
  };

  return gfFixCallTypes;
};
