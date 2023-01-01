'use strict';
const { Model } = require('sequelize');
const config = require('@config');

// Attention! Do not read this from configs. read from env variables instead
const ENABLE_BACKUP_RESTORE = process.env.ENABLE_BACKUP_RESTORE === 'true';

module.exports = (sequelize, DataTypes) => {
  class Backup extends Model {
    static associate(models) {}
  }
  Backup.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      type: {
        allowNull: false,
        type: DataTypes.ENUM('complete', 'custom', 'imported'),
      },
      state: {
        allowNull: false,
        type: DataTypes.ENUM('pending', 'success', 'error'),
      },
      error: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
      file_name: {
        allowNull: false,
        type: DataTypes.STRING(255),
      },
      is_restorable: {
        type: DataTypes.VIRTUAL,
        get: function () {
          return ENABLE_BACKUP_RESTORE;
        },
      },
      creator_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      size: {
        allowNull: false,
        type: DataTypes.BIGINT,
      },
    },
    {
      sequelize,
      tableName: 'global_backups',
      modelName: 'Backup',
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
  return Backup;
};
