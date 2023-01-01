'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const TimeSheet = sequelize.define(
    'TimeSheet',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      owner_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      creator_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
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
      tableName: 'hrms_time_sheet',
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

  TimeSheet.associate = function (models) {
    TimeSheet.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });
    TimeSheet.belongsTo(models.User, {
      foreignKey: 'owner_id',
      as: 'employee',
    });
  };
  return TimeSheet;
};
