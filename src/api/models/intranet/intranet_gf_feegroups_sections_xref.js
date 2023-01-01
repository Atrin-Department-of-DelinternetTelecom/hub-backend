'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const gfFeegroupsSectionsXref = sequelize.define(
    'GfFeegroupsSectionsXref',
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
      feeGroupId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      sectionId: {
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
      tableName: 'gf_feegroups_sections_xref',
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
      ],
    },
  );

  gfFeegroupsSectionsXref.associate = function (models) {
    gfFeegroupsSectionsXref.belongsTo(models.GfSection, {
      foreignKey: 'sectionId',
      as: 'gf_section',
    });
    gfFeegroupsSectionsXref.belongsTo(models.GfFeeGroup, {
      foreignKey: 'feeGroupId',
      as: 'feeGroup',
    });
  };

  return gfFeegroupsSectionsXref;
};
