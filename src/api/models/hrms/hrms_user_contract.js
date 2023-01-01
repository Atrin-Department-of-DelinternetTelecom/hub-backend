'use strict';

const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const UserContract = sequelize.define(
    'UserContract',
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
      owner_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        default: null,
      },
      contract_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
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
      tableName: 'hrms_user_contracts',
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

  UserContract.associate = function (models) {
    UserContract.belongsTo(models.GfContract, {
      foreignKey: 'contract_id',
      as: 'gf_contract',
    });
    UserContract.belongsTo(models.User, {
      foreignKey: 'owner_id',
      as: 'owner',
    });
    UserContract.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });
  };

  return UserContract;
};
