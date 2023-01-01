'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const GfPhonePrefixGroups = sequelize.define(
    'GfPhonePrefixGroups',
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
      prefixCode: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      fixCallTypeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: true,
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
      tableName: 'gf_phone_prefix_groups',
      schema: 'intranet',
      timestamps: true,
      updatedAt: 'updateDate',
      createdAt: 'creationDate',
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
      ],
    },
  );
  GfPhonePrefixGroups.associate = function (models) {
    GfPhonePrefixGroups.belongsTo(models.GfFixCallTypes, {
      foreignKey: 'fixCallTypeId',
      as: 'fixCallType',
    });

    GfPhonePrefixGroups.belongsTo(models.GfFixCallTypes, {
      foreignKey: 'prefixCode',
      as: 'phonePrefix',
    });
  };

  return GfPhonePrefixGroups;
};
