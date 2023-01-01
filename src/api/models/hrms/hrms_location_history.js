'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const LocationHistory = sequelize.define(
    'LocationHistory',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      routeable_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      routeable_type: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      route: {
        type: DataTypes.TEXT,
        allowNull: true,
        get: function () {
          return JSON.parse(this.getDataValue('route') || '{}');
        },
        set: function (value) {
          this.setDataValue('route', JSON.stringify(value));
        },
      },
      dates: {
        type: DataTypes.TEXT,
        allowNull: true,
        get: function () {
          return JSON.parse(this.getDataValue('dates') || '{}');
        },
        set: function (value) {
          this.setDataValue('dates', JSON.stringify(value));
        },
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
      tableName: 'hrms_location_history',
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

  LocationHistory.associate = function (models) {
    LocationHistory.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });
    LocationHistory.belongsTo(models.User, {
      foreignKey: 'routeable_id',
      as: 'user',
      constraints: false,
    });
    LocationHistory.belongsTo(models.Vehicle, {
      foreignKey: 'routeable_id',
      as: 'vehicle',
      constraints: false,
    });
  };
  return LocationHistory;
};
