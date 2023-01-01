'use strict';

const { GfCellProviderFeeBonus, InvoiceProduct } = require('@models').intranet;

const {
  getAllEntities,
  createCatch,
  findAndDeleteIntranet,
  findAndGet,
  findAndUpdate,
} = require('@utils/request-handler');

exports.createGfCellProviderFeeBonus = async (body) => {
  return createCatch(body, GfCellProviderFeeBonus);
};

exports.getGfCellProviderFeeBonus = async function (query) {
  return await getAllEntities(query, GfCellProviderFeeBonus, undefined, [
    {
      model: InvoiceProduct,
      as: 'invoice_product',
      required: false,
    },
  ]);
};

exports.getGfCellProviderFeeBonusId = async function (id) {
  return await findAndGet(id, GfCellProviderFeeBonus, [
    {
      model: InvoiceProduct,
      as: 'invoice_product',
      required: false,
    },
  ]);
};

exports.updateGfCellProviderFeeBonus = async function (id, body) {
  return await findAndUpdate(id, body, GfCellProviderFeeBonus);
};

exports.deleteGfCellProviderFeeBonus = async function (id) {
  return await findAndDeleteIntranet(id, GfCellProviderFeeBonus);
};
