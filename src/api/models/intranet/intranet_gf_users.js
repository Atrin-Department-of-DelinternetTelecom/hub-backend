'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const gfUser = sequelize.define(
    'GfUser',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      uid: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: config.get('index.intranet.uid'),
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      collaboratorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      distributorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      role: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      providerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      typeanalitic: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'gf_users',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: {
        ...intranet.defaultScope,
      },
      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [
            {
              name: 'id',
            },
          ],
        },
      ],
    },
  );

  gfUser.associate = function (models) {
    gfUser.belongsTo(models.User, {
      foreignKey: 'userId',
      targetKey: 'userId',
      as: 'global_user',
    });

    gfUser.hasMany(models.InvoiceClientUserXref, {
      foreignKey: 'userId',
      sourceKey: 'userId',
      as: 'clients',
    });

    gfUser.belongsTo(models.CrmUser, {
      foreignKey: 'userId',
      targetKey: 'userId',
      as: 'crm_user',
    });
    gfUser.belongsTo(models.GfCollaborator, {
      foreignKey: 'collaboratorId',
      as: 'collaborator',
    });
  };

  return gfUser;
};
