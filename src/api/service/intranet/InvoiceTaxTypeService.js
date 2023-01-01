'use strict';

const { InvoiceTaxType } = require('@models').intranet;

const {
  getAllEntities,
  createCatch,
  findAndGet,
  findAndUpdate,
  findAndDelete,
  findAndDeleteIntranet,
} = require('@utils/request-handler');

/**
 *
 * delete a category record by id
 *
 * id String
 * returns Object
 **/
exports.deleteInvoiceTaxTypeId = async function (id) {
  return await findAndDelete(id, InvoiceTaxType);
};

/**
 *
 * soft delete proccess
 *
 * id String
 * returns Object
 **/
exports.destroyInvoiceTaxTypeId = async function (id) {
  return await findAndDeleteIntranet(id, InvoiceTaxType);
};

/**
 * Your GET endpoint
 * get all categories(information) record
 *
 * returns Object
 **/
exports.getInvoiceTaxTypes = async function (query) {
  return await getAllEntities(query, InvoiceTaxType);
};

/**
 * Your GET endpoint
 * get single category record by id
 *
 * id String
 * returns Object
 **/
exports.getInvoiceTaxTypeId = async function (id) {
  return await findAndGet(id, InvoiceTaxType);
};

/**
 *
 * add a category record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postInvoiceTaxType = async function (body) {
  return createCatch(body, InvoiceTaxType);
};

/**
 *
 * update a category record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected category (optional)
 * returns Object
 **/
exports.putInvoiceTaxTypeId = async function (id, body) {
  return await findAndUpdate(id, body, InvoiceTaxType);
};
