'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const GfMarketingConsentType = sequelize.define(
    'GfMarketingConsentType',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      uid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: config.get('index.intranet.uid'),
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      aireNetworksCode: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      createdDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: true,
      },
      updatedDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'gf_marketing_consent_types',
      schema: 'intranet',
      timestamps: true,
      updatedAt: 'updatedDate',
      createdAt: 'createdDate',

      defaultScope: { ...intranet.defaultScope },

      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'id' }],
        },
        {
          name: 'aireNetworksCodeIndex',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'aireNetworksCode' }],
        },
      ],
    },
  );

  return GfMarketingConsentType;
};
