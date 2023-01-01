'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
const _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
  const GfClientsContractsSignature = sequelize.define(
    'GfClientsContractsSignature',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      uid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: config.get('index.intranet.uid'),
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      signature: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      signed: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      useUploaded: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      sentToClient: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      finalDocumentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      uploadedSignedDoc: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      signedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
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
      tableName: 'gf_clients_contracts_signatures',
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

  GfClientsContractsSignature.associate = function (models) {
    GfClientsContractsSignature.belongsTo(models.GfClientDocument, {
      foreignKey: 'finalDocumentId',
      as: 'document',
    });

    GfClientsContractsSignature.belongsToMany(models.GfContract, {
      through: {
        model: models.GfClientsContractsSignaturesContractsXref,
        scope: _.get(intranet, 'defaultScope.where', {}),
      },
      foreignKey: 'signatureId',
      otherKey: 'contractId',
      as: 'contracts',
    });
  };

  return GfClientsContractsSignature;
};
