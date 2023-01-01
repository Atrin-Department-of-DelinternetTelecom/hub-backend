'use strict';

const productService = require('./ProductService');
const InvoiceInvoiceService = require('./InvoiceInvoiceService');
const { modelToJson } = require('@utils/tools');

/**
 *
 * @param {Object} product
 * @param {number} quantity
 * @param {number | null} discount
 * @param {string | null} description
 * @param {number | null} unitPrice
 * @param {object} referer
 * @param {Object} parameters
 * @param {Object | null} taxObject
 */
exports.buildInvoiceLimboLineFromProduct = (
  product,
  quantity,
  discount,
  description = null,
  unitPrice,
  referer,
  parameters,
  taxObject,
) => {
  if (!taxObject) {
    taxObject = productService.generateTaxObject(product);
  }

  return InvoiceInvoiceService._fillConsolidedTotals({
    id: null,
    description: description
      ? description
      : buildLineDescription(product, parameters),
    units: quantity,
    unitPrice: isNaN(unitPrice) ? product.price : unitPrice,
    unitObject: JSON.stringify(modelToJson(product.invoiceUnits)),
    discountPercentage: discount,
    taxObject: JSON.stringify(taxObject),
    productId: product.id,
    productCode: product.productCode,
    includedTaxs: product.includedTaxs,
    refererApp: referer.app,
    refererKey: referer.key,
    refererData: referer.data,
  });
};

const buildLineDescription = (product, parameters) => {
  if (!product.lineDescriptions) {
    let extra = '';
    if (parameters) {
      extra = Object.values(parameters)
        .filter((value) => value)
        .join(',');
    }
    return removePrice(product.name) + (extra ? ` (${extra})` : '');
  }

  const descs = JSON.parse(product.lineDescriptions);
  for (const iso in descs) {
    const desc = descs[iso];
    const fDesc = desc.text;
    for (const key in parameters) {
      const value = parameters[key];
      fDesc.replace(`@${key}`, value);
    }
    descs[iso].text = fDesc;
  }

  return JSON.stringify(descs);
};

function removePrice(text) {
  // Define the regular expression to match the price pattern
  const pricePattern = /\d{1,3}(\.\d{3})*,?\d{2}€/g;

  // Remove the matched prices from the text
  return text.replace(pricePattern, '');
}
