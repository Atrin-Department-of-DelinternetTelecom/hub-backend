'use strict';

const intranet = require('@utils/intranet');
const GfCellProviderFeeBonusFields = require('@resources/intranet/fields/GfCellProviderFeeBonus');

module.exports = function (sequelize, DataTypes) {
  const GfCellProviderFeeBonus = sequelize.define(
    'GfCellProviderFeeBonus',
    new GfCellProviderFeeBonusFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      tableName: 'gf_cell_provider_fee_bonus',
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

  GfCellProviderFeeBonus.associate = function (models) {
    GfCellProviderFeeBonus.hasMany(models.GfContractDataCellInitialBonusXref, {
      foreignKey: 'aireBonoId',
      as: 'xrefs',
    });

    GfCellProviderFeeBonus.hasMany(models.GfCellProviderFeeBonusXref, {
      foreignKey: 'providerBonusId',
      sourceKey: 'providerBonusId',
      as: 'providerXrefs',
    });

    GfCellProviderFeeBonus.hasOne(models.InvoiceProduct, {
      foreignKey: 'code',
      sourceKey: 'tpvCode',
      as: 'invoice_product',
    });
  };

  return GfCellProviderFeeBonus;
};
