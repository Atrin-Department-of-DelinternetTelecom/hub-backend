// @ts-check
'use strict';
import { AnyModel, intranet } from '@models';
import { Op } from 'sequelize';
import { buildKeyByInvoiceControl } from './GfInvoicePeriodService';

const {
  GfInvoiceInvoice,
  InvoicePayment,
  InvoiceLine,
  GfInvoiceControl,
  GfAireInvoiceLine,
  GfDiscountsHistory,
  GfDiscountsScheduled,
} = intranet;

export const csvFileOfPeriod = async function (periodId: number) {
  const invoices = await GfInvoiceInvoice.findAll({
    where: { refererKey: { [Op.like]: `%[periodId:${periodId}]%` } },
    include: [
      { model: InvoicePayment, as: 'payments' },
      { model: InvoiceLine, as: 'invoice_lines' },
    ],
  });

  const controlRowWithTheirKeys: Record<string, AnyModel> = {};
  (
    await GfInvoiceControl.findAll({
      where: { periodId },
      include: [
        { model: GfAireInvoiceLine, as: 'aire_lines', required: false },
        // {
        //   model: GfDiscountsHistory,
        //   as: 'discount_histories',
        //   required: false,
        //   include: [{ model: GfDiscountsScheduled, as: 'scheduled' }],
        // },
      ],
    })
  ).forEach((controlRow) => {
    controlRowWithTheirKeys[buildKeyByInvoiceControl(controlRow)] = controlRow;
  });

  const invoiceJson: Record<string, object> = {};
  invoices.forEach((invoice) => {
    const relatedControlRow = controlRowWithTheirKeys[invoice.refererKey];
    // const history = relatedControlRow.discount_histories;
    invoiceJson[
      `${relatedControlRow.clientId}-${relatedControlRow.invoiceProfileId}`
    ] = {
      total: invoice.total,
      clientId: invoice.clientId,
      date: invoice.date,
      paymentType: invoice.paymentType,
      payDate: invoice.paymentType,
      refererKey: invoice.refererKey,
      controlRow: {
        total: relatedControlRow.total,
        baseTotal: relatedControlRow.baseTotal,
        taxsTotal: relatedControlRow.taxsTotal,
        withError: relatedControlRow.withError,
        errorPhase: relatedControlRow.errorPhase,
      },
      aire: relatedControlRow.aire_lines.map((aire_line: AnyModel) => ({
        providerCode: aire_line?.providerCode,
        fiscalId: aire_line?.fiscalId,
        periodId: aire_line?.periodId,
        number: aire_line?.number,
        month: aire_line?.month,
        year: aire_line?.year,
        data: aire_line?.data,
        errors: aire_line?.errors,
        state: aire_line?.state,
        contractId: aire_line?.contractId,
        invoiceClientId: aire_line?.invoiceClientId,
        controlRowId: aire_line?.controlRowId,
      })),
      payment: {
        quantity: invoice.payments[0].quantity,
        dueDate: invoice.payments[0].dueDate,
        serieId: invoice.payments[0].serieId,
        paymentType: invoice.payments[0].paymentType,
        refererKey: invoice.payments[0].refererKey,
      },
      // discount_histories: {
      //   action: history.action,
      //   amount: history.amount,
      //   previousRow: history.previousRow,
      //   scheduled: {
      //     constractId: history.scheduled.constractId,
      //     matrixId: history.scheduled.matrixId,
      //     executedId: history.scheduled.executedId,
      //     permanentParentId: history.scheduled.permanentParentId,
      //     date: history.scheduled.date,
      //     description: history.scheduled.description,
      //     permanent: history.scheduled.permanent,
      //     discount: history.scheduled.discount,
      //     discountType: history.scheduled.discountType,
      //     type: history.scheduled.type,
      //     state: history.scheduled.state,
      //     tpvCode: history.scheduled.tpvCode,
      //     trace: history.scheduled.trace,
      //     keyGroup: history.scheduled.keyGroup,
      //   },
      // },
      lines: invoice.invoice_lines.map(
        ({
          productId,
          productCode,
          unitObject,
          unitPrice,
          taxTotal,
          includedTax,
          subTotal,
          total,
          refererKey,
        }: AnyModel) => ({
          productId,
          productCode,
          unitObject,
          unitPrice,
          taxTotal,
          includedTax,
          subTotal,
          total,
          refererKey,
        }),
      ),
    };
  });

  return Buffer.from(JSON.stringify(invoiceJson), 'utf8');
};
