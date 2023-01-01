'use strict';
const { Model } = require('sequelize');
const config = require('@config');

module.exports = (sequelize, DataTypes) => {
  class CategoryPack extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      CategoryPack.belongsTo(models.Category, {
        foreignKey: 'category_id',
        as: 'category',
      });
      CategoryPack.belongsTo(models.Pack, {
        foreignKey: 'pack_id',
        as: 'pack',
      });
      CategoryPack.belongsTo(models.User, {
        foreignKey: 'creator_id',
        as: 'creator',
      });
    }
  }

  CategoryPack.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      category_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      pack_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      weight: {
        allowNull: true,
        type: DataTypes.INTEGER,
      },
      published: {
        allowNull: true,
        type: DataTypes.INTEGER,
      },
      type: {
        allowNull: false,
        type: DataTypes.ENUM('pack', 'product'),
      },
      default_definition: {
        allowNull: true,
        type: DataTypes.INTEGER,
      },
      creator_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
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
      modelName: 'CategoryPack',
      tableName: 'web_categories_packs',
      timestamps: true,
      paranoid: true,
      schema: config.get('index.sequelize.system.database'),
      underscored: true,
    },
  );
  return CategoryPack;
};
