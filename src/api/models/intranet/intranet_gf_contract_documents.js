//@ts-check
'use strict';

const GfContractDocumentFields = require('@resources/intranet/fields/GfContractDocument');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const GfContractDocument = sequelize.define(
    'GfContractDocument',
    new GfContractDocumentFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      tableName: 'gf_contract_documents',
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

  GfContractDocument.associate = function (models) {
    GfContractDocument.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });
    GfContractDocument.belongsTo(models.GfClient, {
      foreignKey: 'clientId',
      as: 'client',
    });
    GfContractDocument.belongsTo(models.GfClientDocument, {
      foreignKey: 'clientDocId',
      as: 'document',
    });
  };

  return GfContractDocument;
};
