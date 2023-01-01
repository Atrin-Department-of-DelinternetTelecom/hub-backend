'use strict';

const { InvoiceUnits } = require('@models').intranet;

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
exports.deleteInvoiceUnitsId = async function (id) {
  return await findAndDelete(id, InvoiceUnits);
};

/**
 *
 * soft delete proccess
 *
 * id String
 * returns Object
 **/
exports.destroyInvoiceUnitsId = async function (id) {
  return await findAndDeleteIntranet(id, InvoiceUnits);
};

/**
 * Your GET endpoint
 * get all categories(information) record
 *
 * returns Object
 **/
exports.getInvoiceUnits = async function (query) {
  return await getAllEntities(query, InvoiceUnits);
};

/**
 * Your GET endpoint
 * get single category record by id
 *
 * id String
 * returns Object
 **/
exports.getInvoiceUnitsId = async function (id) {
  return await findAndGet(id, InvoiceUnits);
};

/**
 *
 * add a category record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postInvoiceUnits = async function (body) {
  return createCatch(body, InvoiceUnits);
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
exports.putInvoiceUnitsId = async function (id, body) {
  return await findAndUpdate(id, body, InvoiceUnits);
};
