'use strict';

const config = require('@config');
const { Op } = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  const Closet = sequelize.define(
    'Closet',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'lock',
      },
      code: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      redis_channel: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      creator_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      owner_telegram_username: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      payload: {
        type: DataTypes.TEXT,
        allowNull: true,
        get: function () {
          return JSON.parse(this.getDataValue('payload') || '{}');
        },
        set: function (value) {
          this.setDataValue('payload', JSON.stringify(value));
        },
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
      tableName: 'hrms_closet',
      timestamps: true,
      paranoid: false,
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

  Closet.associate = function (models) {
    Closet.belongsTo(models.User, { foreignKey: 'creator_id', as: 'creator' });
    Closet.belongsToMany(models.User, {
      through: models.ClosetUser,
      foreignKey: 'closet_id',
      otherKey: 'owner_id',
      as: 'owners',
    });

    Closet.belongsToMany(models.User, {
      through: {
        model: models.ClosetUser,
        scope: { deletedAt: { [Op.eq]: null } },
      },
      foreignKey: 'closet_id',
      otherKey: 'owner_id',
      as: 'owner',
    });
  };
  return Closet;
};
