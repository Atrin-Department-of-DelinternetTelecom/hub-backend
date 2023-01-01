'use strict';
const {
  intranet: {
    InvoiceLine,
    GfAireInvoiceLine,
    InvoicePayment,
    GfDiscountsHistory,
    GfDiscountsScheduled,
  },
} = require('@models');

const CounterService = require('../global/CounterService');
const OptimizedGlobalCounterService = require('../global/OptimizedGlobalCounterService');

/**
 * throw back a control row
 * @param {object} invoiceControl control row object with releted invoice
 * @return {Promise<{ success:boolean, reason?: string, control: object }>}
 */
exports.throwbackControlRow = async (invoiceControl, userId = 0) => {
  //invoice is issued
  if (invoiceControl.issued > 0)
    return {
      success: false,
      reason: 'This invoice is issued',
    };

  // invoice not created, just reset control row
  if (invoiceControl.invoiceId <= 0) return _resetCtl(invoiceControl);

  //remove old invoice data
  if (invoiceControl.invoice) {
    await InvoicePayment.update(
      { status: 0 },
      { where: { invoiceId: invoiceControl.invoiceId } },
    );
    await InvoiceLine.update(
      { status: 0 },
      { where: { invoiceId: invoiceControl.invoiceId } },
    );
    invoiceControl.invoice.status = 0;
    invoiceControl.invoice.save();
  }

  await _restoreDiscounts(invoiceControl, userId);

  const aireLines = await GfAireInvoiceLine.count({
    where: { controlRowId: invoiceControl.id },
  });

  //restore gf_aire_invoice_line
  await GfAireInvoiceLine.update(
    {
      state: '',
      invoiceClientId: null,
      controlRowId: null,
      contractId: null,
    },
    {
      where: { controlRowId: invoiceControl.id },
    },
  );

  OptimizedGlobalCounterService.tick(
    `Invoice_GfPeriodsManager_progress_aire_invocie_line_${invoiceControl.periodId}`,
    -aireLines,
  );
  return _resetCtl(invoiceControl);
};

/**
 * restore or remove scheduled discounts related to this control row based on discount history
 * @param {object} invoiceControl invoice control information
 * @return {Promise<{ success:boolean }>}
 */
const _restoreDiscounts = async (invoiceControl, userId) => {
  const actions = await GfDiscountsHistory.findAll({
    where: {
      controlRowId: invoiceControl.id,
    },
    order: [['id', 'DESC']],
  });

  for (const action of actions) {
    if (action.action === 'scheduled') {
      await GfDiscountsScheduled.update(
        {
          status: 0,
        },
        {
          where: {
            id: action.scheduledId,
          },
        },
      );
    } else if (action.previousRow) {
      // restore to orginal state
      const row = JSON.parse(action.previousRow);
      delete row.id;
      delete row.creationDate;
      delete row.updateDate;
      const discount = await GfDiscountsScheduled.findByPk(action.scheduledId);
      await discount.update(row);
    }
  }

  //delete all discount history
  await GfDiscountsHistory.update(
    {
      status: 0,
    },
    {
      where: {
        controlRowId: invoiceControl.id,
      },
    },
  );

  return {
    success: true,
  };
};

/**
 * set default value(0,null) for selected controll row (reset)
 * @param {object} invoiceControl control row information
 * @returns {Promise<{success:boolean,control:object}>}
 */
const _resetCtl = async (invoiceControl) => {
  invoiceControl.invoiceId = null;
  invoiceControl.total = 0;
  invoiceControl.baseTotal = 0;
  invoiceControl.taxsTotal = 0;
  invoiceControl.payDate = null; //MOSTAFA 0000-00-00
  invoiceControl.issuedNumber = null;
  invoiceControl.withError = 0;
  invoiceControl.errorDescription = '';
  invoiceControl.errorPhase = null;
  invoiceControl.cueued = 'waiting';
  await invoiceControl.save();
  return {
    success: true,
    control: invoiceControl,
  };
};
