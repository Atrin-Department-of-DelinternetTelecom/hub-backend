// @ts-check
'use strict';
const {
  intranet: { GfContract, GfContractUnpaid, UnpaidInvoice, UnpaidNotification },
  system: { User },
  AnyModel,
} = require('@models');

const { Op } = require('sequelize');

const { respondBadRequest } = require('@utils/response');
const moment = require('moment');
const _ = require('lodash');

const { addInvoiceIssue } = require('./UnpaidOperatorNotificationService');

const GfContractsUnpaidService = require('../intranet/GfContractsUnpaidService');

const { Unpaid015_ClientHasAnyContractException } =
  require('@utils/exceptions').ExceptionsCode;

const config = require('@config');

const InvoiceIssueType = config.get('index.InvoiceIssueType');

const CrmTaskHelperService = require('../intranet/CrmTaskHelperService');
const { CodedError } = require('@utils/exceptions');

/**
 * @deprecated
 * @param {number} contractId
 * @returns
 */
exports.isAlive = async (contractId) => {
  const unpaid_contract = await GfContractUnpaid.findOne({
    where: {
      contractId,
      alive: 1,
    },
  });

  return unpaid_contract ? unpaid_contract : false;
};

/**
 * @deprecated
 * @param {number} contractId
 * @returns
 */
exports.isContractBlocked = async (contractId) => {
  const alive = await exports.isAlive(contractId);

  return alive ?? false;
};

/**
 * @deprecated
 * @param {number} contractId
 * @param {string} contractState
 * @param {string} sectionState
 * @returns
 */

exports.setOriginalStates = async (contractId, contractState, sectionState) => {
  const alive = await exports.isAlive(contractId);

  if (!alive) {
    return {
      success: false,
      reason: 'No alive',
    };
  }

  await alive.update({
    originalContractState: contractState
      ? contractState
      : alive.originalContractState,
    originalSectionState: sectionState
      ? sectionState
      : alive.originalSectionState,
  });

  return {
    success: true,
    alive: alive,
  };
};

/**
 *
 * @param {number} clientId
 * @returns
 */
exports.isBlocked = async (clientId) => {
  const contracts = await GfContract.findAll({
    where: {
      clientId,
    },
  });

  if (contracts.length === 0) {
    throw Unpaid015_ClientHasAnyContractException(clientId);
  }

  for (const contract of contracts) {
    const alive = await exports.isAlive(contract.id);
    if (alive === false) return false;
    if (alive.downState !== 'done') return false;
  }

  return true;
};

exports.cutTodayUnpaidInvoice = async () => {
  const today = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
  const tomorrow = moment()
    .add(1, 'days')
    .startOf('day')
    .format('YYYY-MM-DD HH:mm:ss');

  const todayUnpaidInvoices = await getUnpaidInvoicesBetweenDates(
    today,
    tomorrow,
  );
  console.log(`cut unpaid invoice between ${today} and ${tomorrow}`);
  console.log(todayUnpaidInvoices.map((ui) => ui.id));

  await cutAll(todayUnpaidInvoices);
};

exports.cutLast60DaysUnpaidInvoice = async () => {
  const last60Days = moment()
    .subtract(60, 'days')
    .startOf('day')
    .format('YYYY-MM-DD HH:mm:ss');
  const today = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
  const unpaidInvoices = await getUnpaidInvoicesBetweenDates(last60Days, today);
  console.log(`cut unpaid invoice between ${last60Days} and ${today}`);
  console.log(unpaidInvoices.map((ui) => ui.id));
  await cutAll(unpaidInvoices);
};

/**
 *
 * @param {string} start_day
 * @param {string} end_day
 * @returns
 */
const getUnpaidInvoicesBetweenDates = async (start_day, end_day) => {
  return UnpaidInvoice.findAll({
    where: {
      invoice_status: 'unpaid',
      cut_date: {
        [Op.between]: [start_day, end_day],
      },
    },
  });
};

/**
 *
 * @param {AnyModel[]} unpaid_invoices
 */
const cutAll = async (unpaid_invoices) => {
  for (const unpaid_invoice of unpaid_invoices) {
    await cut(unpaid_invoice);
  }
};

/**
 *
 * @param {AnyModel} unpaid_invoice
 * @returns
 */
const cut = async (unpaid_invoice) => {
  try {
    if (await hasSuccessSendNotification(unpaid_invoice.id)) {
      let intranetUserId = 0;
      if (unpaid_invoice.user_id) {
        const user = await User.findByPk(unpaid_invoice.user_id);
        if (user?.userId) {
          intranetUserId = user.userId;
        }
      }

      await GfContractsUnpaidService.clientUnpaid(
        unpaid_invoice.client_id,
        null,
        null,
        null,
        null,
        intranetUserId,
        `UnpaidInvoice id:${unpaid_invoice.id} cut`,
      );
      unpaid_invoice.invoice_status = 'cutted';
      await unpaid_invoice.save();
      console.log(`unpaid_invoice id:${unpaid_invoice.id} cutted`);

      await CrmTaskHelperService.saveUnpaidTaskForNotify(unpaid_invoice, 'cut');
    } else {
      const message =
        'InvoiceCouldNotBeCuttedBecauseThereIsNotSuccessNotification';
      unpaid_invoice.exception = JSON.stringify(
        exports.buildExceptionMessage(message, message),
      );
      await unpaid_invoice.save();
      console.log(
        `unpaid_invoice id:${unpaid_invoice.id} has no successful notification`,
      );

      await addInvoiceIssue(
        unpaid_invoice.id,
        unpaid_invoice.invoice_code,
        unpaid_invoice.client_id,
        InvoiceIssueType.INVOICE,
        0,
        message,
        0,
      );
    }
    // @ts-ignore
  } catch (/** @type {Error} */ error) {
    console.log(`unpaid_invoice id:${unpaid_invoice.id} error`, error);

    return exports.handleException(error, unpaid_invoice);
  }
};

/**
 *
 * @param {number} invoice_id
 * @returns
 */
const hasSuccessSendNotification = async (invoice_id) => {
  const sentNotifications = await UnpaidNotification.count({
    where: {
      invoice_id,
      send_status: 'sent',
    },
  });
  return sentNotifications >= 1;
};

exports.buildExceptionMessage = (exception_name = '', payload = '') => {
  return {
    date: moment().format('YYYY-MM-DD HH:mm:ss'),
    exception: exception_name,
    message: payload,
  };
};

/**
 *
 * @param {Error | CodedError} error
 * @param {AnyModel} unpaid_invoice
 * @returns
 */
exports.handleException = async (error, unpaid_invoice) => {
  const code = 'code' in error ? error.code : '-1';
  unpaid_invoice.exception = JSON.stringify(
    exports.buildExceptionMessage(code, error.message),
  );
  await unpaid_invoice.save();
  addInvoiceIssue(
    unpaid_invoice.id,
    unpaid_invoice.invoice_code,
    unpaid_invoice.client_id,
    InvoiceIssueType.INVOICE,
    0,
    code,
    0,
  );
  return respondBadRequest(error.message);
};
