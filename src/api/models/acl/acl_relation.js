'use strict';
const { Model } = require('sequelize');
const config = require('@config');

module.exports = (sequelize, DataTypes) => {
  class AclRelation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      AclRelation.belongsToMany(models.AclRole, {
        through: 'acl_role_relations',
        foreignKey: 'relation_id',
        as: 'roles',
      });
      AclRelation.belongsTo(models.AclApp, {
        foreignKey: 'acl_app_id',
        as: 'app',
      });
      AclRelation.belongsTo(models.AclMenu, {
        foreignKey: 'acl_menu_id',
        as: 'menu',
      });
      AclRelation.belongsTo(models.AclAction, {
        foreignKey: 'acl_action_id',
        as: 'action',
      });
    }
  }

  AclRelation.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      acl_app_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      acl_menu_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      acl_action_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      app_name: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.acl_app_id === null
            ? 'All'
            : this.app == undefined
            ? null
            : this.app.name;
        },
      },
      menu_name: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.acl_menu_id === null
            ? 'All'
            : this.menu == undefined
            ? null
            : this.menu.name;
        },
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
      tableName: 'acl_relations',
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
  return AclRelation;
};
