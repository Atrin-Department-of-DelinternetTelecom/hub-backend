// @ts-check
'use strict';

const {
  intranet: {
    UnpaidXml,
    GfClient,
    GfContract,
    GfInvoiceInvoice,
    InvoiceClientsContact,
    Warehouse,
    InvoicePaymentType,
    UnpaidInvoice,
    UnpaidNotification,
    transaction,
    UnpaidOperatorNotification,
  },
  AnyModel,
} = require('@models');

const {
  respondNotFound,
  respondSuccess,
  respondBadRequest,
  respondInternalServerError,
} = require('@utils/response');

const {
  getAllEntities,
  findAndGet,
  findAndUpdate,
  findAndDeleteIntranet,
} = require('@utils/request-handler');

const {
  buildExceptionMessage,
  handleException,
} = require('./UnpaidContractService');

const { addInvoiceIssue } = require('./UnpaidOperatorNotificationService');

const config = require('@config');
const InvoiceIssueType = config.get('index.InvoiceIssueType');

const moment = require('moment');

const _ = require('lodash');

const GfContractsUnpaidService = require('../intranet/GfContractsUnpaidService');
const CrmTaskHelperService = require('../intranet/CrmTaskHelperService');
const UnpaidNotificationService = require('./UnpaidNotificationService');
const InvoiceInvoiceService = require('@service/intranet/InvoiceInvoiceService');
const assert = require('assert');
const { Op } = require('sequelize');

/**
 *
 * @param {AnyModel} unpaidInvoice
 * @param {AnyModel} user
 * @param {{shopId:number,paymentType:number,includeCommission?:boolean}} paymentOption
 */
async function setAsPaid(
  unpaidInvoice,
  user,
  { shopId, paymentType, includeCommission = true },
) {
  if (unpaidInvoice.invoice_status === 'paid') {
    throw new Error(`UnpaidInvoice is already paid`);
  }

  await transaction(async () => {
    const updateUnpaidInvoice = {
      invoice_status: 'paid',
      payment_type_id: paymentType,
    };

    if (includeCommission) {
      updateUnpaidInvoice.invoice_commission_id =
        await InvoiceInvoiceService.createPaidCommissionInvoice(
          unpaidInvoice.invoice_id,
          unpaidInvoice.unpaid_fee,
          user,
          shopId,
          paymentType,
        );
    }

    await unpaidInvoice.update(updateUnpaidInvoice);

    const invoice = await GfInvoiceInvoice.findByPk(unpaidInvoice.invoice_id);
    assert(invoice, 'invoice not found');

    invoice.actualPayDate = new Date();
    await invoice.save();

    // await CrmTaskHelperService.saveUnpaidTaskForNotify(
    //   unpaidInvoice,
    //   'paid',
    //   user,
    //   {
    //     phone: await exports.getClientPhone(unpaidInvoice.client_id),
    //   },
    // );
  });
}

/**
 *
 * @param {number} id
 * @returns
 */
exports.deleteUnpaidInvoicesId = async function (id) {
  return findAndDeleteIntranet(id, UnpaidInvoice);
};

/**
 *
 * @param {any} query
 * @returns
 */
exports.getUnpaidInvoices = async function (query) {
  const where = {};
  if (query.only === 'has-no-valid-client-phone') {
    where.client = {
      id: await UnpaidNotificationService.getClientIdsWithBadPhone(),
    };
  }

  return getAllEntities(query, UnpaidInvoice, where, [
    {
      as: 'operation_notification',
      model: UnpaidOperatorNotification,
      required: false,
      // DO NOT REMOVE IT!
      separate: true,
    },
    {
      as: 'invoice',
      model: GfInvoiceInvoice,
      required: false,
    },
    {
      as: 'client',
      model: GfClient,
      required: false,
    },
    {
      as: 'payment_type',
      model: InvoicePaymentType,
      required: false,
    },
  ]);
};

/**
 *
 * @param {number} id
 * @returns
 */
exports.getUnpaidInvoicesId = async function (id) {
  return findAndGet(id, UnpaidInvoice);
};

/**
 *
 * @param {any} body
 * @param {AnyModel} user
 * @returns
 */
exports.postUnpaidInvoices = async function (body, user) {
  const { invoiceCode, invoiceId, xml_id } = body;
  if (await wasAlreadyCreated(invoiceId)) {
    return respondBadRequest(
      `[${invoiceId}/code/${invoiceCode}]: unpaid invoice already exist`,
    );
  }

  //find related invoice by code from invoice_invoice
  const gf_invoice = await GfInvoiceInvoice.findOne({
    where: {
      id: invoiceId,
      status: 1,
    },
  });

  if (!gf_invoice) {
    return respondBadRequest(
      `[${invoiceId}/code/${invoiceCode}]: invoice_invoice with this code not exist`,
    );
  }

  //find related client to current invoice
  const gf_client = await GfClient.findOne({
    where: {
      invoiceClientId: gf_invoice.clientId,
      status: 1,
    },
  });

  if (!gf_client) {
    return respondBadRequest(
      `[${invoiceId}/code/${invoiceCode}]:  Client With current invoice does not exist`,
    );
  }

  if (xml_id) {
    const xml = await UnpaidXml.findOne({
      where: {
        id: xml_id,
        // TODO: check status is exist or no
      },
    });
    if (!xml) {
      return respondBadRequest(`Xml with current invoice, does not exits!`);
    }
  }

  //check for template existance
  if (!body.template_id) {
    body.template_id = 0;
  }

  const newUnpaidInvoice = await UnpaidInvoice.create({
    xml_id: body.xml_id,
    invoice_id: gf_invoice.id,
    client_id: gf_client.id,
    template_id: body.template_id,
    send_method: body.send_method,
    invoice_date: gf_invoice.date,
    invoice_code: gf_invoice.code,
    template: body.template,
    msg_period: body.msg_period,
    msgs_per_period: body.msgs_per_period,
    msg_hour: body.msg_hour,
    user_id: user?.id ?? 0,
    unpaid_fee: body.unpaid_fee,
    cut_date: exports.createCutDate(body.msg_period, body.msg_hour),
    pay_date: body.pay_date,
    payment_type_id: body.payment_type_id,
    payment_bank_name: body.payment_bank_name,
    reason: body.reason || 'Unknown reason',
    uid: 90,
    status: 1,
  });

  // event id is null
  newUnpaidInvoice.task_id = await CrmTaskHelperService.saveUnpaidTaskForNotify(
    newUnpaidInvoice,
    'unpaid',
    user,
  );

  await newUnpaidInvoice.save();

  const plainUnpaidInvoice = {
    ...newUnpaidInvoice.get({ plain: true }),
    send_method: body.send_method,
    phone: await exports.getClientPhone(gf_client.id),
    invoice_id: newUnpaidInvoice.id,
  };

  await UnpaidNotificationService.generateNotificationsBaseOnPeriods(
    gf_invoice.id,
    plainUnpaidInvoice,
    user,
  );

  gf_invoice.actualPayDate = null;
  await gf_invoice.save();

  return respondSuccess(plainUnpaidInvoice);
};

/**
 *
 * @param {number} id
 * @param {any} body
 * @returns
 */
exports.putUnpaidInvoicesId = async function (id, body) {
  delete body.invoice_status;
  return findAndUpdate(id, body, UnpaidInvoice);
};

/**
 *
 * @param {string} invoice_id
 * @returns
 */
const wasAlreadyCreated = async (invoice_id) => {
  if (invoice_id === undefined || invoice_id === null) {
    return false;
  }
  const foundInvoice = await UnpaidInvoice.findOne({
    where: {
      invoice_id: invoice_id,
    },
  });
  return !!foundInvoice;
};

/**
 *
 * @param {string} msg_period
 * @param {string} msg_hour
 * @param {string=} created_at
 * @returns
 */
exports.createCutDate = (msg_period, msg_hour, created_at) => {
  const hours = moment(msg_hour).hour();
  const start = created_at ? moment(created_at) : moment();

  return start
    .startOf('day')
    .add(msg_period, 'days')
    .add(hours, 'hours')
    .format('YYYY-MM-DD HH:mm:ss');
};

/**
 *
 * @param {number} client_id
 * @returns
 */
exports.getClientPhone = async (client_id) => {
  const client = await GfClient.findByPk(client_id);
  assert(client);

  const contacts = await InvoiceClientsContact.findAll({
    where: {
      clientId: client.invoiceClientId,
    },
  });

  let phone = '';
  for (const contact of contacts) {
    if (contact.phone) {
      phone = contact.phone;
    }
  }

  if (phone === '') {
    if (!client.contactPhone) return '';
    phone = parseClientNumber(client.contactPhone);
  }

  return phone;
};

/**
 *
 * @param {string} contactPhone
 * @returns {string}
 */
const parseClientNumber = (contactPhone) => {
  const phone = contactPhone.match(/\d+/);
  if (!phone) return '';
  if (phone.length > 0) return phone[0];
  return '';
};

const paymentTypeCode = {
  CASH: 4,
  MOOZAICTPV: 5,
  ONLINEPAYMENT: 18,
  REMESA: 17,
  BANKTRANSFER: 1,
};

/**
 * TODO(ALI): this code will remove after club integration has been finished and both apps use same API
 * @param {number} paymentType
 * @returns {string|undefined} The key corresponding to the payment type or null if not found
 */
export const getPaymentTypeCodeById = (paymentType) => {
  for (const [key, value] of Object.entries(paymentTypeCode)) {
    if (value === paymentType) {
      return key;
    }
  }
  return undefined;
};

/**
 *
 * @param {number} unpaidInvoiceId
 * @param {AnyModel} user
 * @param {{paymentType:'CASH' | 'MOOZAICTPV' | 'ONLINEPAYMENT',shopId:number,includeCommission?:boolean}} paymentOptions
 * @returns
 */
exports.postResumeUnpaidInvoiceId = async (
  unpaidInvoiceId,
  user,
  { shopId, paymentType, includeCommission = true },
) => {
  const unpaidInvoice = await UnpaidInvoice.findByPk(unpaidInvoiceId);

  if (!unpaidInvoice) {
    return respondNotFound(
      `unpaid invoice with id ${unpaidInvoiceId} not found`,
    );
  }
  if (unpaidInvoice.invoice_status === 'paid') {
    throw new Error(`UnpaidInvoice is already paid`);
  }

  if (shopId) {
    const warehouse = await Warehouse.findByPk(shopId);
    if (!warehouse) {
      return respondNotFound(`warehouse with id ${shopId} not found`);
    }
  }

  /**
   * @param {...*} p - The parameters to be logged.
   */
  const log = (...p) =>
    console.log(`[Unpaid][Unpaid:${unpaidInvoiceId}]:`, ...p); // using console.error

  try {
    const hasOtherCuttedInvoices = !!(await UnpaidInvoice.findOne({
      where: {
        client_id: unpaidInvoice.client_id,
        invoice_status: 'cutted',
        id: { [Op.not]: unpaidInvoice.id },
      },
    }));

    log('start resuming', {
      hasOtherCuttedInvoices,
    });

    await cancelAllNotSentNotificationsByInvoiceId(unpaidInvoice.id);

    await setAsPaid(unpaidInvoice, user, {
      shopId,
      paymentType: paymentTypeCode[paymentType]
        ? paymentTypeCode[paymentType]
        : paymentTypeCode.CASH,
      includeCommission,
    });

    log('setted as paid');

    // client has no other unpaid invoices so client can be resumed
    if (!hasOtherCuttedInvoices) {
      const result = await GfContractsUnpaidService.clientResume(
        unpaidInvoice.client_id,
        null,
        user?.userId,
        `UnpaidInvoice id:${unpaidInvoice.id} resume`,
      );

      log(`resume result`, result);
    }

    return respondSuccess({
      message: 'Unpaid invoices state is now paid',
      hasOtherCuttedInvoices,
    });
  } catch (/** @type {*} */ error) {
    console.error('postResumeUnpaidInvoiceId', error);

    if (error.code) {
      handleException(error, unpaidInvoice);
      return respondBadRequest(error.message);
    }

    unpaidInvoice.exception = JSON.stringify(
      buildExceptionMessage('exception', error),
    );
    await unpaidInvoice.save();

    await addInvoiceIssue(
      unpaidInvoice.id,
      unpaidInvoice.invoice_code,
      unpaidInvoice.client_id,
      InvoiceIssueType.INVOICE,
      0,
      error?.message,
    );
    return respondBadRequest(error);
  }
};

/**
 *
 * @param {number} unpaid_invoice_id
 * @returns
 */
const cancelAllNotSentNotificationsByInvoiceId = async (unpaid_invoice_id) => {
  return UnpaidNotification.update(
    {
      send_status: 'canceled',
    },
    {
      where: {
        invoice_id: unpaid_invoice_id,
        send_status: ['pending', 'error'],
      },
    },
  );
};

/**
 * force cut an unpaid invoice
 * @param {number} id of unpaid invoice
 * @param {{ userId: number }} param0 of unpaid invoice
 * @returns {Promise<any>} response that show us the result of task
 */
exports.postForceCutUnpaidInvoiceId = async (id, { userId }) => {
  // check unpaid invoice exist
  const unpaidInvoice = await UnpaidInvoice.findByPk(id);
  if (!unpaidInvoice)
    return respondBadRequest(`unpaid invoice with id ${id} not found`);

  // check if invoice status is pending
  if (unpaidInvoice.invoice_status !== 'unpaid') {
    respondSuccess(
      `unpaid invoice with id ${id} is ${unpaidInvoice.invoice_status}`,
    );
  }

  const result = await GfContractsUnpaidService.clientUnpaid(
    unpaidInvoice.client_id,
    null,
    null,
    null,
    null,
    userId,
    `UnpaidInvoice id:${unpaidInvoice.id} forceCut`,
  );

  let shouldUpdateStatus = result.success;
  if (
    !result.success &&
    result.errors.every((error) => error.code === 'ALREADY_UNPAID')
  ) {
    shouldUpdateStatus = true;
  }

  if (shouldUpdateStatus) {
    // update status of current unpaid invoice
    unpaidInvoice.invoice_status = 'cutted';
    await unpaidInvoice.save();
    return respondSuccess(unpaidInvoice);
  }

  return respondInternalServerError(result.reason, result.result);
};

/**
 * get status of client contracts
 * @param {number} clientId id of client
 * @returns {Promise<any>} respond that contain status
 */
exports.getClientStatus = async (clientId) => {
  const susceptibleBlockContracts =
    await GfContractsUnpaidService.susceptibleContracts(clientId, {
      includeSection: true,
    });
  const susceptibleResumeContracts =
    await GfContractsUnpaidService.susceptibleResumeContracts(clientId, {
      includeSection: true,
    });

  const totalContracts = await GfContract.count({
    where: {
      clientId,
    },
  });

  if (
    susceptibleBlockContracts.length === 0 &&
    susceptibleResumeContracts.length === 0
  ) {
    return respondSuccess({
      status: 'no-contract',
      total_contracts: totalContracts,
      total_susceptible_block_contracts: 0,
      total_susceptible_resume_contracts: 0,
      susceptible_block_contracts: susceptibleBlockContracts,
      susceptible_resume_contracts: susceptibleResumeContracts,
    });
  }

  let status = 'block-unblock';

  if (susceptibleBlockContracts.length === 0) {
    status = 'block';
  } else if (susceptibleResumeContracts.length === 0) {
    status = 'unblock';
  }

  return respondSuccess({
    status,
    total_contracts: totalContracts,
    total_susceptible_block_contracts: susceptibleBlockContracts.length,
    total_susceptible_resume_contracts: susceptibleResumeContracts.length,
    susceptible_block_contracts: susceptibleBlockContracts,
    susceptible_resume_contracts: susceptibleResumeContracts,
  });
};

/**
 *
 * @param {number} client_id
 * @returns
 */
exports.getUnpaidInvoicesTotalAmount = async (client_id) => {
  const unpaidInvoices = await UnpaidInvoice.findAll({
    where: {
      client_id,
      invoice_status: 'unpaid',
    },
    include: {
      model: GfInvoiceInvoice,
      as: 'invoice',
      required: true,
      attributes: ['id', 'total'],
    },
  });

  const totalAmount = unpaidInvoices
    .map((unpaidInvoice) => Number(unpaidInvoice.invoice.total))
    .reduce((a, b) => a + b, 0)
    .toFixed(2);

  return respondSuccess({
    total_unpaid_invoices: unpaidInvoices.length,
    total_unpaid_invoices_amount: totalAmount,
  });
};
