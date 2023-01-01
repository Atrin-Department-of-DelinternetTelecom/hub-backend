'use strict';

const GfClientDocumentConceptFields = require('@resources/intranet/fields/GfClientDocumentConcept');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const GfClientDocumentConcept = sequelize.define(
    'GfClientDocumentConcept',
    new GfClientDocumentConceptFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      tableName: 'gf_client_document_concepts',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'upudateDate',

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

  GfClientDocumentConcept.associate = function (models) {
    GfClientDocumentConcept.hasMany(models.GfClientDocument, {
      foreignKey: 'conceptId',
      as: 'documents',
    });
  };

  return GfClientDocumentConcept;
};
