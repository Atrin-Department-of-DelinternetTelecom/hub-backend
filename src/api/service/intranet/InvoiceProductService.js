// @ts-check
'use strict';

const {
  intranet: {
    InvoiceProduct,
    InvoiceProductTaxXref,
    InvoiceTaxType,
    InvoiceUnits,
  },
  AnyModel,
} = require('@models');
const {
  getAllEntities,
  findAndDeleteIntranet,
  findAndGet,
  findAndUpdate,
} = require('@utils/request-handler');
const { Op } = require('sequelize');
const { respondCreated, respondNotFound } = require('@utils/response');
const { syncMtoN } = require('@utils/sequelize');

const buildCode = async (name) => {
  // TODO(erfan): this function is really bad and should be refactored
  let code = '';
  const words = name.split('-');
  let len;
  if (words.length == 1) {
    len = 4;
  } else if (1 < words.length && words.length < 3) {
    len = 4;
  } else if (words.length > 2) {
    len = 2;
  }

  words.forEach((word) => {
    code = code.concat(word.substring(0, len));
  });

  const num = await InvoiceProduct.count({
    where: { code: { [Op.like]: code + '%' } },
  });

  const str = ('000000000000' + (num + 1)).slice(-3);
  code = code + '/' + str;

  return code;
};
/**
 * Your GET endpoint
 * create new FeeGroup label record
 *
 * returns Object
 **/
exports.createInvoiceProduct = async function (body) {
  for (let i = 0; i < body.taxes.length; i++) {
    if (body.taxes[i] == 'InvoiceProducts_taxes') {
      delete body.taxes[i];
    }
  }

  if (!body.code) body.code = await buildCode(body.name);
  body.shortcut_taxesIds = JSON.stringify(body.taxes);
  const invoiceProduct = await InvoiceProduct.create(body);

  for (let i = 0; i < body.taxes.length; i++) {
    await InvoiceProductTaxXref.create({
      productId: invoiceProduct.id,
      taxId: Number(body.taxes[i]),
    });
  }

  return respondCreated(invoiceProduct);
};

/**
 * Your GET endpoint
 * get all FeeGroup labels(information) record
 *
 * returns Object
 **/
exports.getInvoiceProduct = async function (query) {
  return await getAllEntities(query, InvoiceProduct, undefined, [
    {
      model: InvoiceProductTaxXref,
      as: 'taxes',
      required: false,
      include: {
        model: InvoiceTaxType,
        as: 'tax',
        required: false,
      },
    },
    {
      model: InvoiceUnits,
      as: 'invoiceUnits',
      required: false,
    },
  ]);
};

/**
 * Your GET endpoint
 * get single FeeGroup label record by id
 *
 * id String
 * returns Object
 **/
exports.getInvoiceProductById = async function (id) {
  return findAndGet(id, InvoiceProduct, [
    {
      model: InvoiceProductTaxXref,
      as: 'taxes',
      required: false,
      include: {
        model: InvoiceTaxType,
        as: 'tax',
        required: false,
      },
    },
    {
      model: InvoiceUnits,
      as: 'invoiceUnits',
      required: false,
    },
  ]);
};

/**
 * Your GET endpoint
 * update single FeeGroup lable record by id
 *
 * returns Object
 **/
exports.updateInvoiceProduct = async function (id, body) {
  const invoiceProduct = await InvoiceProduct.findByPk(id);
  if (!invoiceProduct)
    return respondNotFound(`invoice product with id ${id} not found`);

  if (!body.code) body.code = await buildCode(body.name);

  for (let i = 0; i < body.taxes.length; i++) {
    if (body.taxes[i] == 'InvoiceProducts_taxes') {
      delete body.taxes[i];
    }
  }
  if (body.taxes) {
    body.shortcut_taxesIds = JSON.stringify(body.taxes);
  }

  await syncMtoN(InvoiceProductTaxXref, 'productId', id, 'taxId', body.taxes);

  return findAndUpdate(id, body, InvoiceProduct);
};

/**
 * Your GET endpoint
 * delete single FeeGroup label record by id
 *
 * returns Object
 **/
exports.deleteInvoiceProduct = async function (id) {
  return findAndDeleteIntranet(id, InvoiceProduct);
};

/**
 * @type {Record<string,AnyModel> }
 */
const allRelatedProducts = {};

/**
 * @type {Record<string,AnyModel>}
 */
const allRelatedProductsByCode = {};

exports.getIndexedInvoiceProducts = async (indexedBy = 'id', force = false) => {
  if (!Object.keys(allRelatedProducts).length || force) {
    (
      await InvoiceProduct.findAll({
        include: {
          model: InvoiceUnits,
          as: 'invoiceUnits',
          required: false,
        },
      })
    ).forEach((product) => {
      allRelatedProducts[product.id] = product;
      allRelatedProductsByCode[product.code] = product;
    });
  }
  return indexedBy === 'id' ? allRelatedProducts : allRelatedProductsByCode;
};
