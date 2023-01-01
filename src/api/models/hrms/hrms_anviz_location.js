'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const Location = sequelize.define(
    'Location',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      locationable_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      locationable_type: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      location: {
        type: DataTypes.TEXT,
        allowNull: false,
        get: function () {
          return JSON.parse(this.getDataValue('location') || '{}');
        },
        set: function (value) {
          this.setDataValue('location', JSON.stringify(value));
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
      tableName: 'hrms_anviz_location',
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

  Location.associate = function (models) {
    Location.belongsTo(models.User, {
      foreignKey: 'locationable_id',
      as: 'user',
    });
    Location.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });
    Location.belongsTo(models.Vehicle, {
      foreignKey: 'locationable_id',
      as: 'vehicle',
    });
  };
  return Location;
};
