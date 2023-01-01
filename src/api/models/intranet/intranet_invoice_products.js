'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
const { Op } = require('sequelize');
const slugify = require('slugify');
module.exports = function (sequelize, DataTypes) {
  const InvoiceProduct = sequelize.define(
    'InvoiceProduct',
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
      noBillable: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      lineDescriptions: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      price: {
        type: DataTypes.DECIMAL(11, 3),
        allowNull: true,
        defaultValue: 0.0,
      },
      costPrice: {
        type: DataTypes.DECIMAL(11, 3),
        allowNull: true,
        defaultValue: 0.0,
      },
      unitTypeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      shortcut_taxesIds: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      includedTaxs: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      refererKey: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      refererApp: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      refererData: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      externalPrice: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
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
      tableName: 'invoice_products',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',

      defaultScope: { ...intranet.defaultScope },

      hooks: {
        async beforeCreate(invoice) {
          invoice.code = invoice.code
            ? invoice.code
            : await invoice.generateNewCode(invoice.name);
        },
        async beforeUpdate(invoice) {
          invoice.code = invoice.code
            ? invoice.code
            : await invoice.generateNewCode(invoice.name);
        },
      },

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

  InvoiceProduct.associate = function (models) {
    InvoiceProduct.belongsTo(models.GfCellProviderFee, {
      foreignKey: 'code',
      targetKey: 'tpvCode',
      as: 'cellProviderFees',
    });

    InvoiceProduct.belongsTo(models.GfCellProviderFeeBonus, {
      foreignKey: 'code',
      targetKey: 'tpvCode',
      as: 'cellProviderFeeBonuses',
    });

    InvoiceProduct.belongsTo(models.InvoiceUnits, {
      foreignKey: 'unitTypeId',
      as: 'invoiceUnits',
    });

    InvoiceProduct.hasMany(models.InvoiceProductTaxXref, {
      foreignKey: 'productId',
      as: 'taxes',
    });
  };

  InvoiceProduct.prototype.generateNewCode = async function (name) {
    name = slugify(name);
    let code = '';
    const words = name.split('-');
    let length = 2;

    if (words.length === 1) length = 4;
    if (words.length === 2) length = 3;

    for (const word of words) {
      code += word.substr(0, length).toUpperCase();
    }

    const count = await InvoiceProduct.count({
      where: {
        code: { [Op.like]: `%${code}%` },
      },
    });

    return code + String('000000000000' + (count + 1)).substr(-3);
  };

  return InvoiceProduct;
};
