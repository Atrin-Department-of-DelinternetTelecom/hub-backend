'use strict';
const { Model } = require('sequelize');
const config = require('@config');

module.exports = (sequelize, DataTypes) => {
  class ClientComment extends Model {
    static get avatarBucket() {
      return 'ClientCommentAvatar';
    }
    get avatarUrl() {
      return this.avatar ? `/uploads/client-avatar/${this.avatar}` : null;
    }
  }

  ClientComment.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      avatar: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      comment: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      deletedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'ClientComment',
      tableName: 'web_client_comments',
      underscored: true,
      timestamps: true,
      schema: config.get('index.sequelize.system.database'),
      paranoid: true,
    },
  );

  return ClientComment;
};
