'use strict';
const { Model } = require('sequelize');
const config = require('@config');

module.exports = (sequelize, DataTypes) => {
  class AclMenu extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      AclMenu.belongsTo(models.AclApp, { foreignKey: 'acl_app_id', as: 'app' });
      AclMenu.hasMany(models.AclAction, {
        foreignKey: 'acl_menu_id',
        as: 'action_items',
      });
      AclMenu.belongsTo(models.User, {
        foreignKey: 'creator_id',
        as: 'creator',
      });
    }
  }

  AclMenu.init(
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
      acl_app_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      creator_id: {
        allowNull: true,
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
      tableName: 'acl_menus',
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
  return AclMenu;
};
