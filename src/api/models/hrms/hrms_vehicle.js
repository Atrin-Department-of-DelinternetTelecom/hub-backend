'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const Vehicle = sequelize.define(
    'Vehicle',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      info: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      plate: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      number: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      creator_id: {
        type: DataTypes.BIGINT.UNSIGNED,
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
      tableName: 'hrms_vehicle',
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

  Vehicle.associate = function (models) {
    Vehicle.belongsTo(models.User, { foreignKey: 'creator_id', as: 'creator' });
    Vehicle.belongsToMany(models.User, {
      through: 'hrms_vehicle_driver',
      as: 'drivers',
      foreignKey: 'vehicle_id',
    });
    Vehicle.hasMany(models.LocationHistory, {
      foreignKey: 'routeable_id',
      constraints: false,
      scope: {
        routeable_type: 'vehicle',
      },
      as: 'routes',
    });
  };
  return Vehicle;
};
