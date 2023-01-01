'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const notification = sequelize.define(
    'Notification',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      owner_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      app: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      concept: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      subject: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      text: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      package: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      read: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
      },
      image: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
      icon: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
      metadata: {
        allowNull: true,
        type: DataTypes.TEXT,
        get: function () {
          return JSON.parse(this.getDataValue('metadata') || '{}');
        },
        set: function (value) {
          this.setDataValue('metadata', JSON.stringify(value));
        },
      },
      debug: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
      creator_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
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
      tableName: 'global_notifications',
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
  notification.associate = function (models) {
    notification.belongsTo(models.User, {
      foreignKey: 'owner_id',
      as: 'owner',
    });
    notification.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });
  };
  return notification;
};
