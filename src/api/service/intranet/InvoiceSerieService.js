'use strict';

const { InvoiceSerie } = require('@models').intranet;

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
exports.deleteInvoiceSeriesId = async function (id) {
  return await findAndDelete(id, InvoiceSerie);
};

/**
 *
 * soft delete proccess
 *
 * id String
 * returns Object
 **/
exports.destroyInvoiceSeriesId = async function (id) {
  return await findAndDeleteIntranet(id, InvoiceSerie);
};

/**
 * Your GET endpoint
 * get all categories(information) record
 *
 * returns Object
 **/
exports.getInvoiceSeries = async function (query) {
  return await getAllEntities(query, InvoiceSerie);
};

/**
 * Your GET endpoint
 * get single category record by id
 *
 * id String
 * returns Object
 **/
exports.getInvoiceSeriesId = async function (id) {
  return await findAndGet(id, InvoiceSerie);
};

/**
 *
 * add a category record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postInvoiceSeries = async function (body) {
  return createCatch(body, InvoiceSerie);
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
exports.putInvoiceSeriesId = async function (id, body) {
  return await findAndUpdate(id, body, InvoiceSerie);
};
