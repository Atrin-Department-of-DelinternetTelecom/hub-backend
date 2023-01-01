'use strict';

const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const UserDocument = sequelize.define(
    'UserDocument',
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
      employee_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      file: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: false,
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
      tableName: 'hrms_user_documents',
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

  UserDocument.associate = function (models) {
    UserDocument.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });
    UserDocument.belongsTo(models.User, {
      foreignKey: 'employee_id',
      as: 'employee',
    });
  };

  return UserDocument;
};
