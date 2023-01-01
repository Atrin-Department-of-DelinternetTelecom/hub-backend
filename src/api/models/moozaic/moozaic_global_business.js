'use strict';

const Sequelize = require('sequelize');
const { getConnection } = require('@lib/sequelize');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const MoozaicGlobalBusiness = sequelize.define(
    'MoozaicGlobalBusiness',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      nif: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      address: {
        type: DataTypes.STRING,
      },
      postalCode: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      city: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      state: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      isoCode: {
        type: DataTypes.STRING(3),
        defaultValue: null,
      },
      web: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      country: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      email: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      logo: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      phones: {
        type: DataTypes.STRING,
      },
      corporateColor: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      uid: {
        type: DataTypes.INTEGER,
      },
      status: {
        type: DataTypes.INTEGER,
      },
      updateDate: {
        type: DataTypes.DATE,
      },
      creationDate: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      tableName: 'global_business',
      schema: 'moozaic',
      defaultScope: {
        ...intranet.defaultScope,
      },
      timestamps: false,
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

  MoozaicGlobalBusiness.associate = function (models) {};
  return MoozaicGlobalBusiness;
};
