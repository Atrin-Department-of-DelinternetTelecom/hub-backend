'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const UserDocs = sequelize.define(
    'UserDocs',
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
      owner_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      docs_information: {
        type: DataTypes.TEXT,
        allowNull: true,
        get: function () {
          return JSON.parse(this.getDataValue('docs_information') || '{}');
        },
        set: function (value) {
          this.setDataValue('docs_information', JSON.stringify(value));
        },
      },
      admin_doc_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      image_id: {
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
      tableName: 'hrms_user_docs',
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
  UserDocs.associate = function (models) {
    UserDocs.belongsTo(models.File, { foreignKey: 'file_id', as: 'file' });
    UserDocs.belongsTo(models.File, {
      foreignKey: 'image_id',
      as: 'pdf_image',
    });
    UserDocs.belongsTo(models.Folder, {
      foreignKey: 'folder_id',
      as: 'folder',
    });
    UserDocs.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });
    UserDocs.belongsTo(models.User, { foreignKey: 'owner_id', as: 'owner' });
    UserDocs.belongsTo(models.AdminDocs, {
      foreignKey: 'admin_doc_id',
      as: 'admin_doc',
    });
  };
  return UserDocs;
};
