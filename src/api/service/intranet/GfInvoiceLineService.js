'use strict';

const { GfInvoiceLine } = require('@models').intranet;

const {
  getAllEntities,
  createCatch,
  findAndDeleteIntranet,
  findAndGet,
  findAndUpdate,
  handleError,
} = require('@utils/request-handler');

const { Op } = require('sequelize');

const {
  respondBadRequest,
  respondNotFound,
  respondOK,
  respondCreated,
  respondSuccess,
} = require('@utils/response');

const _ = require('lodash');

/**
 *
 * delete a gf invoice line record by id
 *
 * id String
 * returns Object
 **/
exports.deleteGfInvoiceLinesId = async function (id) {
  return await findAndDeleteIntranet(id, GfInvoiceLine);
};

/**
 * Your GET endpoint
 * get all  gfinvoice line record
 *
 * returns Object
 **/
exports.getGfInvoiceLines = async function (query) {
  return await getAllEntities(query, GfInvoiceLine);
};

/**
 * Your GET endpoint
 * get single invoice line record by id
 *
 * id String
 * returns Object
 **/
exports.getGfInvoiceLinesId = async function (id) {
  return await findAndGet(id, GfInvoiceLine);
};

/**
 *
 * save  gf invoice line of an employee
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postGfInvoiceLines = async function (body) {
  return respondCreated(
    await GfInvoiceLine.create(body).catch((err) => console.log(err)),
  );
};

/**
 *
 * update a   gf invoice line record by id
 *
 * id String
 * returns Object
 **/
exports.putGfInvoiceLinesId = async function (id, body) {
  return await findAndUpdate(id, body, GfInvoiceLine);
};
