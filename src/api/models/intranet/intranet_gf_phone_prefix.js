'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const GfPhonePrefix = sequelize.define(
    'GfPhonePrefix',
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
      prefix: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      prefixType: {
        type: DataTypes.ENUM('prefix', 'regexp'),
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM('I', 'N', 'M', 'RI', 'O'),
        allowNull: true,
      },
      countryIso: {
        type: DataTypes.STRING(3),
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      code: {
        type: DataTypes.STRING(255),
        allowNull: true,
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
      tableName: 'gf_phone_prefix',
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
  GfPhonePrefix.associate = function (models) {
    GfPhonePrefix.hasMany(models.GfPhonePrefixGroupsXref, {
      foreignKey: 'prefixCode',
      as: 'fixCallTypes',
    });
  };

  return GfPhonePrefix;
};
