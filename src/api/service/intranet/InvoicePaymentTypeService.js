'use strict';

const { InvoicePaymentType } = require('@models').intranet;

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
exports.deleteInvoicePaymentTypesId = async function (id) {
  return await findAndDelete(id, InvoicePaymentType);
};

/**
 *
 * soft delete proccess
 *
 * id String
 * returns Object
 **/
exports.destroyInvoicePaymentTypesId = async function (id) {
  return await findAndDeleteIntranet(id, InvoicePaymentType);
};

/**
 * Your GET endpoint
 * get all categories(information) record
 *
 * returns Object
 **/
exports.getInvoicePaymentTypes = async function (query) {
  return await getAllEntities(query, InvoicePaymentType);
};

/**
 * Your GET endpoint
 * get single category record by id
 *
 * id String
 * returns Object
 **/
exports.getInvoicePaymentTypesId = async function (id) {
  return await findAndGet(id, InvoicePaymentType);
};

/**
 *
 * add a category record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postInvoicePaymentTypes = async function (body) {
  return createCatch(body, InvoicePaymentType);
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
exports.putInvoicePaymentTypesId = async function (id, body) {
  return await findAndUpdate(id, body, InvoicePaymentType);
};
