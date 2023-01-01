'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const InvoiceProductTaxXref = sequelize.define(
    'InvoiceProductTaxXref',
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
      productId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      taxId: {
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
      tableName: 'invoice_product_tax_xref',
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

  InvoiceProductTaxXref.associate = function (models) {
    InvoiceProductTaxXref.belongsTo(models.InvoiceProduct, {
      foreignKey: 'productId',
      as: 'product',
    });

    InvoiceProductTaxXref.belongsTo(models.InvoiceTaxType, {
      foreignKey: 'taxId',
      as: 'tax',
    });
  };

  return InvoiceProductTaxXref;
};
