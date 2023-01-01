'use strict';
const { Model } = require('sequelize');
const config = require('@config');

module.exports = (sequelize, DataTypes) => {
  class Pack extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Pack.hasMany(models.Definition, {
        foreignKey: 'pack_id',
        as: 'definitions',
      });
      Pack.belongsTo(models.User, { foreignKey: 'creator_id', as: 'creator' });
      Pack.belongsToMany(models.Category, {
        through: 'web_categories_packs',
        as: 'categories',
        foreignKey: 'pack_id',
      });
    }
  }
  Pack.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      alias: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      type: {
        allowNull: false,
        type: DataTypes.ENUM('pack', 'product'),
      },
      from: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      to: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      tax: {
        allowNull: false,
        type: DataTypes.DOUBLE(8, 2),
      },
      discount: {
        defaultValue: 0,
        type: DataTypes.DOUBLE(8, 2),
      },
      discount_type: {
        defaultValue: 'fix',
        type: DataTypes.ENUM('percentage', 'fix'),
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
      modelName: 'Pack',
      tableName: 'web_packs',
      timestamps: true,
      paranoid: true,
      schema: config.get('index.sequelize.system.database'),
      underscored: true,
    },
  );
  return Pack;
};
