'use strict';
const { Model } = require('sequelize');
const config = require('@config');

module.exports = (sequelize, DataTypes) => {
  class AclUserRole extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      AclUserRole.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      AclUserRole.belongsTo(models.AclRole, {
        foreignKey: 'role_id',
        as: 'role',
      });
    }
  }

  AclUserRole.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      user_id: {
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
      tableName: 'acl_user_roles',
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
  return AclUserRole;
};
