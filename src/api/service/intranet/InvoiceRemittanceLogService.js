//@ts-check
'use strict';

const {
  intranet: {
    GfClient,
    GfInvoiceInvoice,
    InvoiceRemitanceLog,
    InvoiceRemitances,
    InvoicePayment,
  },
} = require('@models');
const requestHandler = require('@utils/request-handler');
const { respondNotFound } = require('@utils/response');
const { Sequelize } = require('sequelize');

/**
 * remove remittance log by id
 * @param {number} id
 * @returns
 */
exports.deleteInvoiceRemitanceLogsId = async function (id) {
  return requestHandler.findAndDeleteIntranet(id, InvoiceRemitanceLog);
};

/**
 * get list of remittance logs
 * @param {object} query
 * @returns
 */
exports.getInvoiceRemitanceLogs = async function (query) {
  return requestHandler.getAllEntities(query, InvoiceRemitanceLog, undefined, [
    {
      model: InvoicePayment,
      as: 'payment',
      required: false,
      include: {
        model: GfInvoiceInvoice,
        as: 'invoice',
        required: false,
        include: { model: GfClient, as: 'client', required: false },
      },
    },
    {
      model: InvoiceRemitances,
      as: 'remitance',
    },
  ]);
};

/**
 * get remittance log by id
 * @param {number} id
 * @returns
 */
exports.getInvoiceRemitanceLogsId = async function (id) {
  return requestHandler.findAndGet(id, InvoiceRemitanceLog, [
    {
      model: InvoicePayment,
      as: 'payment',
      required: false,
      include: {
        model: GfInvoiceInvoice,
        as: 'invoice',
        required: false,
        include: { model: GfClient, as: 'client', required: false },
      },
    },
    {
      model: InvoiceRemitances,
      as: 'remitance',
    },
  ]);
};

/**
 * create new remittance log
 * @param {{remitacneId:number,paymentId:number}} body
 * @returns
 */
exports.postInvoiceRemitanceLogs = async function (body) {
  const remittance = await InvoiceRemitances.findByPk(body.remitacneId);
  if (!remittance)
    respondNotFound(`remittance with id ${body.remitacneId} not found`);

  const payment = await InvoicePayment.findOne({
    where: { id: body.paymentId, status: [0, 1] },
  });
  if (!payment)
    return respondNotFound(`payment with id ${body.remitacneId} not found`);

  const remitanceLog = await InvoiceRemitanceLog.create(body);
  return exports.getInvoiceRemitanceLogsId(remitanceLog.id);
};

/**
 * update remitance log by iid
 * @param {number} id
 * @param {{remitacneId:number,paymentId:number}} body
 * @returns
 */
exports.putInvoiceRemitanceLogsId = async function (id, body) {
  const remitance_log = await InvoiceRemitanceLog.findByPk(id);
  if (!remitance_log)
    return respondNotFound(`remittance log with id ${id} not found`);

  const remittance = await InvoiceRemitances.findByPk(body.remitacneId);
  if (!remittance)
    return respondNotFound(`remittance with id ${body.remitacneId} not found`);

  const payment = await InvoicePayment.findOne({
    where: { id: body.paymentId, status: [0, 1] },
  });
  if (!payment)
    return respondNotFound(`payment with id ${body.remitacneId} not found`);

  await remitance_log.update(body);
  return exports.getInvoiceRemitanceLogsId(remitance_log.id);
};

/**
 *  get list of remmitance ids and check has error or no for each one
 * @param {number[]} remittanceIds list of remittance ids
 * @return {Promise<object>} object with key remittance id and boolean value of error status
 */
exports.checkRemittancesError = async (remittanceIds) => {
  const logs = await InvoiceRemitanceLog.findAll({
    attributes: [
      'remitanceId',
      [Sequelize.fn('COUNT', Sequelize.col('remitanceId')), 'remitanceErrors'],
    ],
    where: { remitanceId: remittanceIds, type: 'error' },
    group: ['remitanceId'],
  });

  /** @type {Record<string,boolean>} */
  const remittance_status = {};

  for (const log of logs) {
    remittance_status[log.remitanceId] = true;
  }
  return remittance_status;
};
