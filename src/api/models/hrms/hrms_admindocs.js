'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const AdminDocs = sequelize.define(
    'AdminDocs',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      folder_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      file_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      creator_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      user_docs: {
        type: DataTypes.TEXT,
        allowNull: true,
        get: function () {
          return JSON.parse(this.getDataValue('user_docs') || '{}');
        },
        set: function (value) {
          this.setDataValue('user_docs', JSON.stringify(value));
        },
      },
      image_id: {
        allowNull: true,
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
      tableName: 'hrms_admin_docs',
      timestamps: true,
      underscored: true,
      paranoid: true,
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
  AdminDocs.associate = function (models) {
    AdminDocs.belongsTo(models.File, { foreignKey: 'file_id', as: 'file' });
    AdminDocs.belongsTo(models.File, {
      foreignKey: 'image_id',
      as: 'pdf_image',
    });
    AdminDocs.belongsTo(models.Folder, {
      foreignKey: 'folder_id',
      as: 'folder',
    });
    AdminDocs.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });
    AdminDocs.hasMany(models.UserDocs, {
      foreignKey: 'admin_doc_id',
      as: 'users_docs',
    });
  };
  return AdminDocs;
};
