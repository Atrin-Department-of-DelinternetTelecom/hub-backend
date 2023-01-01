'use strict';

const { InvoiceMoneyTypes } = require('@models').intranet;

const {
  getAllEntities,
  createCatch,
  findAndDeleteIntranet,
  findAndGet,
  findAndUpdate,
} = require('@utils/request-handler');

/**
 * Your GET endpoint
 * create new FeeGroup label record
 *
 * returns Object
 **/
exports.createInvoiceMoneyType = async function (body) {
  return await createCatch(body, InvoiceMoneyTypes);
};

/**
 * Your GET endpoint
 * get all FeeGroup labels(information) record
 *
 * returns Object
 **/
exports.getInvoiceMoneyTypes = async function (query) {
  return await getAllEntities(query, InvoiceMoneyTypes);
};

/**
 * Your GET endpoint
 * get single FeeGroup label record by id
 *
 * id String
 * returns Object
 **/
exports.getInvoiceMoneyTypeById = async function (id) {
  return await findAndGet(id, InvoiceMoneyTypes);
};

/**
 * Your GET endpoint
 * update single FeeGroup lable record by id
 *
 * returns Object
 **/
exports.updateInvoiceMoneyType = async function (id, body) {
  return await findAndUpdate(id, body, InvoiceMoneyTypes);
};

/**
 * Your GET endpoint
 * delete single FeeGroup label record by id
 *
 * returns Object
 **/
exports.deleteInvoiceMoneyTypes = async function (id) {
  return await findAndDeleteIntranet(id, InvoiceMoneyTypes);
};
