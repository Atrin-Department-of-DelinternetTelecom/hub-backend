'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const Anviz = sequelize.define(
    'Anviz',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      uuid: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      basic_setting: {
        type: DataTypes.TEXT,
        allowNull: true,
        get: function () {
          return JSON.parse(this.getDataValue('basic_setting') || '{}');
        },
        set: function (value) {
          this.setDataValue('basic_setting', JSON.stringify(value));
        },
      },
      device_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      ip: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      location: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      name: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      port: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      timeout: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      is_enable: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      username: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      password: {
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
      tableName: 'hrms_anviz',
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

  Anviz.associate = function (models) {
    Anviz.belongsTo(models.User, { foreignKey: 'creator_id', as: 'creator' });
    Anviz.belongsToMany(models.User, {
      through: 'hrms_anviz_staff',
      as: 'users',
      foreignKey: 'anviz_id',
    });
    Anviz.belongsToMany(models.User, {
      through: 'hrms_anviz_staff_fingerprint',
      as: 'fingers',
      foreignKey: 'anviz_id',
    });
  };
  return Anviz;
};
