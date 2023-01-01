'use strict';
const { Model } = require('sequelize');
const config = require('@config');

module.exports = (sequelize, DataTypes) => {
  class Definition extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Definition.belongsTo(models.Pack, { foreignKey: 'pack_id', as: 'pack' });
      Definition.belongsTo(models.User, {
        foreignKey: 'creator_id',
        as: 'creator',
      });
      Definition.hasMany(models.Section, {
        foreignKey: 'definition_id',
        as: 'sections',
      });
      Definition.hasMany(models.Text, {
        foreignKey: 'locator_id',
        constraints: false,
        scope: {
          locator_type: 'definition',
        },
        as: 'texts',
      });
    }
  }

  Definition.init(
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
      pack_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      weight: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      default: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
      },
      published: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
      },
      home_page: {
        allowNull: false,
        defaultValue: false,
        type: DataTypes.BOOLEAN,
      },
      products_hide: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
      },
      metadata: {
        allowNull: false,
        type: DataTypes.TEXT,
        defaultValue: '{}',
        get: function () {
          return JSON.parse(this.getDataValue('metadata') || '{}');
        },
        set: function (value) {
          this.setDataValue('metadata', JSON.stringify(value));
        },
      },
      features_hide: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
      },
      class_list: {
        allowNull: true,
        type: DataTypes.STRING,
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
      modelName: 'Definition',
      tableName: 'web_definitions',
      timestamps: true,
      paranoid: true,
      schema: config.get('index.sequelize.system.database'),
      underscored: true,
    },
  );
  return Definition;
};
