'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const GfClientsContractsSignaturesContractsXref = sequelize.define(
    'GfClientsContractsSignaturesContractsXref',
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
      signatureId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      contractId: {
        type: DataTypes.INTEGER,
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
      tableName: 'gf_clients_contracts_signatures_contracts_xref',
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

  GfClientsContractsSignaturesContractsXref.associate = function (models) {
    GfClientsContractsSignaturesContractsXref.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });

    GfClientsContractsSignaturesContractsXref.belongsTo(
      models.GfClientsContractsSignature,
      {
        foreignKey: 'signatureId',
        as: 'signature',
      },
    );
  };

  return GfClientsContractsSignaturesContractsXref;
};
