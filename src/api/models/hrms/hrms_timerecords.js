'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const TimeRecord = sequelize.define(
    'TimeRecord',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      anviz_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      enter: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      exit: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      creator_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
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
      tableName: 'hrms_timerecords',
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

  TimeRecord.associate = function (models) {
    TimeRecord.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    TimeRecord.belongsTo(models.Anviz, { foreignKey: 'anviz_id', as: 'anviz' });
    TimeRecord.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });
  };
  return TimeRecord;
};
