//@ts-check
'use strict';

const GfDocumentTypeFields = require('@resources/intranet/fields/GfDocumentType');
const intranet = require('@utils/intranet');
const _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
  const GfDocumentType = sequelize.define(
    'GfDocumentType',
    new GfDocumentTypeFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      tableName: 'gf_document_types',
      schema: 'intranet',
      timestamps: true,
      updatedAt: 'updateDate',
      createdAt: 'creationDate',

      defaultScope: { ...intranet.defaultScope },

      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'id' }],
        },
        {
          name: 'aireNetworksCodeIndex',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'aireNetworksCode' }],
        },
      ],
    },
  );

  GfDocumentType.prototype.indexByAireCode = async () => {
    const documentTypes = await GfDocumentType.findAll({
      attributes: ['aireNetworksCode', 'id'],
    });

    return _.fromPairs(
      documentTypes.map((documentType) => {
        return [documentType.aireNetworksCode, documentType.id];
      }),
    );
  };

  return GfDocumentType;
};
