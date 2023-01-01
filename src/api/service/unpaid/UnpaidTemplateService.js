'use strict';

const { UnpaidTemplate } = require('@models').intranet;
const moment = require('moment');

const { respondCreated } = require('@utils/response');

const {
  getAllEntities,
  findAndUpdate,
  findAndGet,
  findAndDeleteIntranet,
} = require('@utils/request-handler');

const UnpaidInvoiceService = require('@service/unpaid/UnpaidInvoiceService');

const _ = require('lodash');

/**
 *
 * delete a basic information record by id
 *
 * id String
 * returns Object
 **/
exports.deleteUnpaidTemplatesId = async function (id) {
  return findAndDeleteIntranet(id, UnpaidTemplate);
};

/**
 * Your GET endpoint
 * get all basic information record
 *
 * returns Object
 **/
exports.getUnpaidTemplates = async function (query) {
  return getAllEntities(query, UnpaidTemplate);
};

/**
 * Your GET endpoint
 * get single basic information record by id
 *
 * id String
 * returns Object
 **/
exports.getUnpaidTemplatesId = async function (id) {
  return findAndGet(id, UnpaidTemplate);
};

/**
 * Find a template
 * @param {String} name
 * @returns {String}
 */
exports.getUnpaidTemplateByName = async function (name = '') {
  const tempRecord = await UnpaidTemplate.findOne({
    where: {
      name,
    },
  });
  if (!tempRecord) {
    return '';
  }
  return tempRecord.content;
};

/**
 *
 * save basic information of an employee
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postUnpaidTemplates = async function (body) {
  return respondCreated(await UnpaidTemplate.create(body));
};

/**
 *
 * update a basic information record by id
 *
 * id String
 * body Body in this example we want to change the
 * department of employee's basic information (optional)
 * returns Object
 **/
exports.putUnpaidTemplatesId = async function (id, body) {
  return findAndUpdate(id, body, UnpaidTemplate);
};

exports.renderWithInvoiceData = (invoice, data) => {
  if (!data.template) return '';
  if (!data.cut_date) {
    console.warn('data.cut_date is not available! fall bak to old method');
    data.cut_date = UnpaidInvoiceService.createCutDate(
      data.msg_period,
      data.msg_hour,
    );
  }
  const invoice_total = parseFloat(invoice.total);
  const unpaid_fee = parseFloat(data.unpaid_fee);
  const fee_total = (invoice_total + unpaid_fee).toFixed(2);
  return data.template
    .replace('{name}', invoice.clientName)
    .replace('{total}', invoice_total)
    .replace('{code}', invoice.code)
    .replace('{unpaidFee}', unpaid_fee)
    .replace('{fee_total}', fee_total)
    .replace('{date}', moment(data.cut_date).format('YYYY-MM-DD HH:mm'));
};
