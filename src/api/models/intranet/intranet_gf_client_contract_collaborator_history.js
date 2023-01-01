'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
const Sequelize = require('sequelize');
const _ = require('lodash');
module.exports = function (sequelize, DataTypes) {
  const GfClientContractCollaboratorHistory = sequelize.define(
    'GfClientContractCollaboratorHistory',
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
      fromCollaboratorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      changeDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM('contract', 'client'),
        allowNull: true,
        defaultValue: 'contract',
      },
      typeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      changeDoneBy: {
        type: DataTypes.INTEGER,
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
      tableName: 'gf_client_contract_collaborator_history',
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

  GfClientContractCollaboratorHistory.associate = function (models) {
    GfClientContractCollaboratorHistory.belongsTo(models.GfContract, {
      foreignKey: 'fromCollaboratorId',
      as: 'fromCollaborator',
    });
  };

  return GfClientContractCollaboratorHistory;
};
