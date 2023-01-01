'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const StaffFingerPrint = sequelize.define(
    'StaffFingerPrint',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      anviz_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      finger: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      creator_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      fingerprint_template: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      hardware_name: {
        type: DataTypes.STRING(255),
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
      tableName: 'hrms_anviz_staff_fingerprint',
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

  StaffFingerPrint.associate = function (models) {
    StaffFingerPrint.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
    StaffFingerPrint.belongsTo(models.Anviz, {
      foreignKey: 'anviz_id',
      as: 'anviz',
    });
    StaffFingerPrint.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });
  };
  return StaffFingerPrint;
};
