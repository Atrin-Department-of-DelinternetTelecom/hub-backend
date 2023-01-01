'use strict';

const { InvoiceTaxType } = require('@models').intranet;

exports.generateTaxObject = async (product) => {
  const taxes = Object.keys(JSON.parse(product.shortcut_taxesIds));

  const taxTypes = {};
  (
    await InvoiceTaxType.findAll({
      where: {
        id: taxes,
      },
    })
  ).forEach((taxType) => {
    taxTypes[taxType.id] = taxType;
  });

  const taxObject = [];
  taxes.forEach((tax) => {
    const taxType = taxTypes[tax];
    taxObject.push({
      name: taxType.name,
      value: taxType.value,
      id: taxType.id,
    });
  });

  return taxObject;
};
