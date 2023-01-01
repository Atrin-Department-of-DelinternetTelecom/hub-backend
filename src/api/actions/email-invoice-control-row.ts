'use strict';
import * as GfInvoicePeriodService from '../service/intranet/GfInvoicePeriodService';
import { AnyModel, intranet } from '@models';

import CounterService from '../service/global/CounterService';

const { GfInvoicePeriod, GfClient, GfInvoiceControl, GfInvoiceInvoice } =
  intranet;

import assert from 'assert';
import { mailInvoiceBy } from '@api/service/intranet/InvoiceMailService';

export default async function process(
  params: {
    controlId: number;
    last: boolean;
    first: boolean;
    control: boolean;
  },
  bulk: AnyModel,
) {
  const { controlId, control, first, last } = params;
  const invoiceControl = await GfInvoiceControl.findByPk(controlId, {
    include: [
      { model: GfInvoicePeriod, as: 'period' },
      {
        model: GfInvoiceInvoice,
        as: 'invoice',
        include: [{ model: GfClient, as: 'client' }],
      },
    ],
  });
  assert(invoiceControl, 'control not found');

  const period = invoiceControl.period;
  const client = invoiceControl.invoice?.client;

  try {
    const CanQueueStart = await canQueStart(invoiceControl);

    if (!CanQueueStart.success) {
      if (first || last || control) await doControl(period, last);
      throw new Error(CanQueueStart.reason);
    }

    if (invoiceControl.emailSent)
      throw new Error(`email already sent to client`);

    if (invoiceControl.invoice?.state !== 'issued')
      throw new Error(
        `Inapropiate invoice state '${invoiceControl.invoice?.state}'`,
      );

    if (client?.emailAddress) await mailInvoiceBy(invoiceControl);

    invoiceControl.cueuedEmail = 'processed';
    invoiceControl.emailSent = 1;
    await invoiceControl.save();
    CounterService.tick(`Invoice_GfPeriodsManager_progress_mail_${period.id}`);
    if (first || last || control) await doControl(period, last);
    return { success: true };
  } catch (error) {
    await handleError(error, period, first, last, control, invoiceControl);
  }
}

const canQueStart = async (invoiceControl: AnyModel) => {
  invoiceControl.cueuedEmail = invoiceControl.cueuedEmail
    ? invoiceControl.cueuedEmail
    : 'waiting';

  if (invoiceControl.cueuedEmail !== 'waiting') {
    return {
      success: false,
      reason: `inapropiate cueuedEmail state: ${invoiceControl.cueuedEmail}`,
    };
  }

  invoiceControl.cueuedIssued = 'cueued';
  if (invoiceControl.cueuedIssued !== 'cueued') {
    return {
      success: false,
      reason: `bad queue state ${invoiceControl.cueuedIssued}`,
    };
  }

  invoiceControl.cueuedEmail = 'processing';
  await invoiceControl.save();

  return {
    success: true,
    row: invoiceControl,
    periodId: invoiceControl.periodId,
    clientId: invoiceControl.clientId,
  };
};

const doControl = async (period: AnyModel, last: boolean) => {
  if (last) {
    period.emailsState = 'done';
  }
  await GfInvoicePeriodService.consolideTotals(period);
};

const handleError = async (
  error: Error | unknown,
  period: AnyModel,
  first: boolean,
  last: boolean,
  control: boolean,
  controlRow: AnyModel,
) => {
  controlRow.cueuedEmail = 'waiting';
  controlRow.errorPhase = 'emailSent';
  controlRow.withError = 1;
  controlRow.errorDescription = `CUE:${error}\n${controlRow.errorDescription}`;
  await controlRow.save();
  await CounterService.tick(
    `Invoice_GfPeriodsManager_progress_mail_errors_${period.id}`,
  );
  if (first || last || control) await doControl(period, last);

  return { success: true };
};
