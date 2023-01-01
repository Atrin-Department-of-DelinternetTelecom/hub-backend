'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const Counter = sequelize.define(
    'Counter',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      key: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      init: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      max: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      value: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      model_name: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      model_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'global_counter',
      timestamps: true,
      underscored: true,
      schema: config.get('index.sequelize.system.database'),
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

  return Counter;
};
