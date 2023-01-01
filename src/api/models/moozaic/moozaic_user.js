'use strict';

const Sequelize = require('sequelize');
const { getConnection } = require('@lib/sequelize');

import intranet from '@utils/intranet';

module.exports = function (sequelize, DataTypes) {
  const MoozaicUser = sequelize.define(
    'MoozaicUser',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      user: {
        type: DataTypes.STRING(255),
      },
      password: {
        type: DataTypes.STRING(255),
      },
      uid: {
        type: DataTypes.INTEGER,
        defaultValue: 90,
      },
      image: {
        type: DataTypes.STRING(255),
      },
      name: {
        type: DataTypes.STRING(255),
      },
      email: {
        type: DataTypes.STRING(255),
      },
      language: {
        type: DataTypes.STRING(3),
      },
      admin: {
        type: DataTypes.INTEGER,
        defaultValue: null,
        allowNull: true,
      },
      cronUser: {
        type: Sequelize.BOOLEAN,
        defaultValue: null,
        allowNull: true,
      },
      stripe_id: {
        type: DataTypes.STRING(255),
        defaultValue: null,
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
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
      tableName: 'moozaic_users',
      schema: 'moozaic',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: { ...intranet.defaultScope },
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

  MoozaicUser.associate = function (models) {};
  return MoozaicUser;
};
