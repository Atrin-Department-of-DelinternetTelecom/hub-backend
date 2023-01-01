'use strict';

const { PaymentPeriodType } = require('@models').intranet;

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
exports.createPaymentPeriodType = async function (body) {
  return await createCatch(body, PaymentPeriodType);
};

/**
 * Your GET endpoint
 * get all FeeGroup labels(information) record
 *
 * returns Object
 **/
exports.getPaymentPeriodType = async function (query) {
  return await getAllEntities(query, PaymentPeriodType);
};

/**
 * Your GET endpoint
 * get single FeeGroup label record by id
 *
 * id String
 * returns Object
 **/
exports.getPaymentPeriodTypeById = async function (id) {
  return await findAndGet(id, PaymentPeriodType);
};

/**
 * Your GET endpoint
 * update single FeeGroup lable record by id
 *
 * returns Object
 **/
exports.updatePaymentPeriodType = async function (id, body) {
  return await findAndUpdate(id, body, PaymentPeriodType);
};

/**
 * Your GET endpoint
 * delete single FeeGroup label record by id
 *
 * returns Object
 **/
exports.deletePaymentPeriodType = async function (id) {
  return await findAndDeleteIntranet(id, PaymentPeriodType);
};
