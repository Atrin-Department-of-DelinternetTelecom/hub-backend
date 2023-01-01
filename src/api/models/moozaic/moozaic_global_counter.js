'use strict';

const Sequelize = require('sequelize');
const { getConnection } = require('@lib/sequelize');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const MoozaicGlobalCounter = sequelize.define(
    'MoozaicGlobalCounter',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      code: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      init: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      end: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      count: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
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
      tableName: 'global_counter',
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

  MoozaicGlobalCounter.associate = function (models) {};
  return MoozaicGlobalCounter;
};
