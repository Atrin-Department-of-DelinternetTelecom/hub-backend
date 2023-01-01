'use strict';

const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const GfKamailioProvider = sequelize.define(
    'GfKamailioProvider',
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
        defaultValue: -1,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      ips: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      providerCode: {
        type: DataTypes.ENUM('aire', 'tucall', 'del', 'iron'),
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
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
    },
    {
      sequelize,
      tableName: 'gf_kamailio_providers',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: {
        ...intranet.defaultScope,
      },
      schema: 'intranet',
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

  return GfKamailioProvider;
};
