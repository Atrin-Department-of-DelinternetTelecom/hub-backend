'use strict';

module.exports = function (sequelize, DataTypes) {
  const MoozaicUserRole = sequelize.define(
    'MoozaicUserRole',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      uid: {
        type: DataTypes.INTEGER,
      },
      application: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      role: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      value: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
      },
      updateDate: {
        type: DataTypes.DATE,
      },
      creationDate: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      tableName: 'moozaic_users_roles',
      schema: 'moozaic',
      timestamps: false,
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

  MoozaicUserRole.associate = function (models) {};
  return MoozaicUserRole;
};
