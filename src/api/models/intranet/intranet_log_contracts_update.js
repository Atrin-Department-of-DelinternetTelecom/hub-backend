'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
const _ = require('lodash');
module.exports = function (sequelize, DataTypes) {
  const LogContractUpdate = sequelize.define(
    'LogContractUpdate',
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
      contractId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      dateActivation: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      newParams: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      oldParams: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      requestParams: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      requestUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      signature: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'log_contracts_update',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',

      defaultScope: { ...intranet.defaultScope },

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

  LogContractUpdate.associate = function (models) {
    LogContractUpdate.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });
    LogContractUpdate.belongsTo(models.GfUser, {
      foreignKey: 'userId',
      targetKey: 'userId',
      as: 'user',
    });
  };

  return LogContractUpdate;
};
