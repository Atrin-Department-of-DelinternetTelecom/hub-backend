'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const Folder = sequelize.define(
    'Folder',
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
        unique: true,
      },
      creator_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      total_docs: {
        type: DataTypes.INTEGER,
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
      tableName: 'hrms_folder',
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
  Folder.associate = function (models) {
    Folder.hasMany(models.AdminDocs, {
      foreignKey: 'folder_id',
      as: 'admin_documents',
    });
    Folder.hasMany(models.UserDocs, {
      foreignKey: 'folder_id',
      as: 'user_documents',
    });
    Folder.belongsTo(models.User, { foreignKey: 'creator_id', as: 'creator' });
  };
  return Folder;
};
