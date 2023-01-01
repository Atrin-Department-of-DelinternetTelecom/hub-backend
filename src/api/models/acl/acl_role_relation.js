'use strict';
const { Model } = require('sequelize');
const config = require('@config');
module.exports = (sequelize, DataTypes) => {
  class AclRoleRelation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      AclRoleRelation.belongsTo(models.AclRelation, {
        foreignKey: 'relation_id',
        as: 'permission',
      });
      AclRoleRelation.belongsTo(models.AclRole, {
        foreignKey: 'role_id',
        as: 'role',
      });
    }
  }

  AclRoleRelation.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      relation_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      role_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
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
      tableName: 'acl_role_relations',
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
  return AclRoleRelation;
};
