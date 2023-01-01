'use strict';
const { Model } = require('sequelize');
const config = require('@config');
module.exports = (sequelize, DataTypes) => {
  class AclAction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      AclAction.belongsTo(models.AclMenu, {
        foreignKey: 'acl_menu_id',
        as: 'menu',
      });
      AclAction.belongsTo(models.User, {
        foreignKey: 'creator_id',
        as: 'creator',
      });
    }
  }

  AclAction.init(
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
      creator_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      acl_menu_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      api_method: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      api_path: {
        allowNull: false,
        type: DataTypes.STRING,
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
      tableName: 'acl_actions',
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
  return AclAction;
};
