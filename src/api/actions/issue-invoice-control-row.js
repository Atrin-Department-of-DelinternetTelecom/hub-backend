'use strict';
const Invoice_GfClientInvoiceService = require('../service/intranet/Invoice_GfClientInvoiceService');
const GfInvoicePeriodService = require('../service/intranet/GfInvoicePeriodService');
const { GfInvoicePeriod, GfInvoiceControl, GfInvoiceInvoice, InvoiceLine } =
  require('@models').intranet;
const OptimizedGlobalCounterService = require('../service/global/OptimizedGlobalCounterService');

const { Bulk } = require('@models').system;

const CounterService = require('../service/global/CounterService');
const { Op } = require('sequelize');
const { get: config } = require('@config');
const { Static } = require('@lib/cache');
const key = 'INVOICES_MUST_CACHE';
const actionRunner = require('@lib/action-runner').default;

/**
 * @param {{controlId:number,last:boolean,first:boolean,control:boolean}} params
 */
module.exports = async function process(params, bulk) {
  const { controlId, last, first, control } = params;
  const invoiceControl = await GfInvoiceControl.findByPk(controlId, {
    include: [
      { model: GfInvoicePeriod, as: 'period' },
      { model: GfInvoiceInvoice, as: 'invoice' },
    ],
  });
  const period = invoiceControl.period;
  try {
    const CanQueueStart = await canQueStart(invoiceControl);
    if (!CanQueueStart.success) {
      if (first || last || control) await doControl(period, last);
      throw new Error(CanQueueStart.reason);
    }

    const result = await Invoice_GfClientInvoiceService.issueInvoice(
      invoiceControl,
    );

    // if (await isCachableInvoice(invoiceControl.invoiceId)) {
    //   const invoiceIds = await Static.get(key);
    //   await Static.remember(
    //     key,
    //     invoiceIds.concat(`,${invoiceControl.invoiceId}`),
    //   );
    // }

    if (result && result.success) {
      await OptimizedGlobalCounterService.tick(
        `Invoice_GfPeriodsManager_progress_issued_${period.id}`,
      );
    } else {
      throw new Error(result.reason);
    }

    invoiceControl.cueuedIssued = 'processed';
    invoiceControl.issued = 1;
    await invoiceControl.save();
    if (first || control) await doControl(period, last);

    if (last) {
      await doControl(period, last);
      // await createCacheBulk(period);
    }

    return { success: true };
  } catch (error) {
    await handleError(error, period, first, last, control, invoiceControl);
  }
};

/**
 * check that can queue start or no
 * @param {object} invoiceControl invoice control info
 * @returns {Promise<{ success:boolean, reason?: string, row?: number, periodId?: number, clientId?: number }>}
 */
const canQueStart = async (invoiceControl) => {
  invoiceControl.cueuedIssued = invoiceControl.cueuedIssued
    ? invoiceControl.cueuedIssued
    : 'waiting';

  if (invoiceControl.cueuedIssued !== 'waiting') {
    return {
      success: false,
      reason: `inapropiate cueuedIssued state: ${invoiceControl.cueuedIssued}`,
    };
  }

  invoiceControl.cueuedIssued = 'cueued';
  if (invoiceControl.cueuedIssued !== 'cueued') {
    return {
      success: false,
      reason: `bad queue state ${invoiceControl.cueuedIssued}`,
    };
  }

  invoiceControl.cueuedIssued = 'processing';
  await invoiceControl.save();

  return {
    success: true,
    row: invoiceControl,
    periodId: invoiceControl.periodId,
    clientId: invoiceControl.clientId,
  };
};

/**
 * update states in invoice period and calculate total status and put in period totals
 * @param {object} period period info for check is last data to update state
 * @param {boolean} last is this last control row or no
 */
const doControl = async (period, last) => {
  if (last) {
    period.issuedState = 'done';
  }
  await GfInvoicePeriodService.consolideTotals(period);
};

/**
 * handle error in process of invocing for each control raw (update some field of control)
 * @param {object} error error reason
 * @param {object} period period information
 * @param {boolean} first is first control ?
 * @param {boolean} last is last control?
 * @param {boolean} control refresh some flag
 * @param {object} controlRow control row information to update
 * @returns {Promise<{success:boolean}>}
 */
const handleError = async (error, period, first, last, control, controlRow) => {
  controlRow.cueued = 'waiting';
  controlRow.errorPhase = 'issued';
  controlRow.withError = 1;
  controlRow.errorDescription = `CUE:${error}\n${controlRow.errorDescription}`;
  await controlRow.save();
  await CounterService.tick(
    `Invoice_GfPeriodsManager_progress_issued_errors_${period.id}`,
  );
  if (first || last || control) await doControl(period, last);

  return { success: true };
};

const isCachableInvoice = async (invoiceId) => {
  const numberOfInvoiceLines = await InvoiceLine.count({
    where: {
      invoiceId,
      //count number of cell products that we have in invoice line
      refererData: {
        [Op.and]: [
          { [Op.like]: '%"type":"CELL"%' },
          { [Op.notLike]: '%"manualDiscount"%' },
          { [Op.notLike]: '%"aire_bono"%' },
        ],
      },
    },
  });

  return (
    numberOfInvoiceLines >
    config('index.invoice.invoiceCellServiceCacheThreshold')
  );
};

const createCacheBulk = async (period) => {
  const invoiceIds = (await Static.get(key))?.subString(1) ?? '';
  const actions = invoiceIds.split(',').map((invoiceId) => ({
    name: 'cache-pdf-invoice',
    params: {
      invoiceId,
    },
  }));

  const issueBulk = await Bulk.findOne({
    where: {
      name: 'issue-invoice-control-row',
      status: 'running',
      model_id: period.id,
    },
    order: [['createdAt', 'DESC']],
  });

  await actionRunner.createBulk(
    {
      creator_id: issueBulk.creator_id,
      name: 'cache-pdf-invoice',
      model_name: 'gf_invoice_periods:cacheInvoice',
      model_id: period.id,
      params: {
        fetchActions: 10,
      },
    },
    actions,
  );
};
