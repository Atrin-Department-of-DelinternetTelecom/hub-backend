'use strict';

const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const Material = sequelize.define(
    'Material',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      creator_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      doc_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      image_1: {
        type: DataTypes.TEXT,
        allowNull: true,
        default: null,
      },
      image_2: {
        type: DataTypes.TEXT,
        allowNull: true,
        default: null,
      },
      image_3: {
        type: DataTypes.TEXT,
        allowNull: true,
        default: null,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
        default: null,
      },
      status: {
        type: DataTypes.ENUM('pending', 'signed', 'returned', 'rejected'),
        allowNull: false,
      },
      receive_date: {
        type: DataTypes.DATE,
        allowNull: true,
        default: null,
      },
      return_date: {
        type: DataTypes.DATE,
        allowNull: true,
        default: null,
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
      tableName: 'hrms_material',
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

  Material.associate = function (models) {
    Material.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
    Material.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });
    Material.belongsTo(models.Document, {
      foreignKey: 'doc_id',
      as: 'document',
    });
  };

  return Material;
};
