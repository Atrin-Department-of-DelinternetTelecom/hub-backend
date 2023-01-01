'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const VehicleDriver = sequelize.define(
    'VehicleDriver',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      driver_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      vehicle_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'hrms_vehicle',
          key: 'id',
        },
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      km_image_start: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      km_image_end: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      start_km_num: {
        type: DataTypes.DOUBLE(8, 2),
        allowNull: true,
      },
      end_km_num: {
        type: DataTypes.DOUBLE(8, 2),
        allowNull: true,
      },
      creator_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
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
      tableName: 'hrms_vehicle_driver',
      timestamps: true,
      paranoid: true,
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

  return VehicleDriver;
};
