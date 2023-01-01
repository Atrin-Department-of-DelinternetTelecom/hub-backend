'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const gfFeegroupsGroupLabelsXref = sequelize.define(
    'GfFeegroupsGroupLabelsXref',
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
      labelId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      feeGroupId: {
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
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'gf_feegroups_group_labels_xref',
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

  gfFeegroupsGroupLabelsXref.associate = function (models) {
    gfFeegroupsGroupLabelsXref.belongsTo(models.GfFeegroupsGroupLabel, {
      foreignKey: 'labelId',
      as: 'grouplabel',
    });
    gfFeegroupsGroupLabelsXref.belongsTo(models.GfFeeGroup, {
      foreignKey: 'feeGroupId',
      as: 'feeGroup',
    });
  };

  return gfFeegroupsGroupLabelsXref;
};
