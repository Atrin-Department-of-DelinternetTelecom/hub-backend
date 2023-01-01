// @ts-check
'use strict';

import { AnyModel, intranet } from '@models';
const { InvoicePaymentType, InvoicePayment, PaymentPeriodType } = intranet;

import moment from 'moment';

import { get as config } from '@config';

import * as NumeraService from '@service/intranet/NumeraService';

import { fn, col } from 'sequelize';
import { generateInvoice } from './GfInvoiceService';

let MoozaicTPV: AnyModel | null = null;
export const getMoozaicOnlinPaymentType = async (force = false) => {
  if (MoozaicTPV === null || force) {
    MoozaicTPV = await InvoicePaymentType.findOne({
      where: { type: 'MoozaicTPV' },
    });
  }

  return MoozaicTPV;
};

let CashFlow: AnyModel | null = null;
export const getMoozaicCashPaymentType = async (force = false) => {
  if (CashFlow === null || force) {
    CashFlow = await InvoicePaymentType.findOne({
      where: { type: 'CashFlow' },
    });
  }

  return CashFlow;
};

let shipment: AnyModel | null = null;
export const getMoozaicShipmentPaymentType = async (force = false) => {
  if (shipment === null || force) {
    shipment = await InvoicePaymentType.findOne({
      where: { type: 'Shipment' },
    });
  }

  return shipment;
};

let BankTransfer: AnyModel | null = null;
export const getMoozaicBankTransferPaymentType = async (force = false) => {
  if (BankTransfer === null || force) {
    BankTransfer = await InvoicePaymentType.findOne({
      where: { type: 'BankTransfer' },
    });
  }

  return BankTransfer;
};

const getPaymentDates = (
  periodsTypeRow: AnyModel,
  initDay: moment.Moment | null = null,
) => {
  if (!initDay) {
    initDay = moment();
  }

  const numPayments = periodsTypeRow?.numberOfPayments;

  const dates = [];

  let prevDate = initDay;
  for (let n = 0; n < numPayments; n++) {
    const nextPayment = moment(prevDate)
      .add(Number(periodsTypeRow.dayInterval), 'day')
      .add(Number(periodsTypeRow.weekInterval), 'weeks')
      .add(Number(periodsTypeRow.monthInterval), 'months');

    prevDate = nextPayment;
    dates.push(nextPayment.format('YYYY-MM-DD'));
  }

  return dates;
};

export const getPaymentPeriodsTypeByCode = async (code: string) => {
  return PaymentPeriodType.findOne({
    where: {
      code,
    },
  });
};

export const getTotalFromInvoice = async (
  invoiceId: number,
  state = 'paid',
) => {
  const totalAmount = await InvoicePayment.findAll({
    where: {
      invoiceId,
      state,
      status: 1,
      uid: config('index.intranet.uid'),
    },
    attributes: [[fn('sum', col('quantity')), 'q']],
  });

  return Number(totalAmount[0].dataValues.q).toFixed(2);
};

export const cancelDueInvoicePayments = async function (invoiceId: number) {
  await InvoicePayment.update(
    { state: 'canceled' },
    {
      where: {
        invoiceId,
        state: 'due',
      },
    },
  );
};

export const createInvoicePaymentsForAutomaticInvoice = async function (
  invoice: Exclude<
    Awaited<ReturnType<typeof generateInvoice>>['invoice'],
    undefined
  >,
  typeId: number,
  refererKey: string | null = null,
) {
  const periodType = periodsTypesByCode.ONE;
  if (!periodType) throw new Error(`default period type not found`);

  //find invoice payment type
  await initInvoicePaymentType();
  typeId = typeId || invoice.paymentType;

  const invoicePaymentType = invoicePaymentTypes[typeId];
  if (!invoicePaymentType) {
    throw new Error(`Payment type not found (${typeId})`);
  }

  //get dates of pay by invoice payment type and period type and pay date
  const dates = getPaymentDates(periodType, moment(invoice.payDate));

  const pendingTotal = Number(invoice.total);
  const pieCacke = pendingTotal / dates.length;
  let tmpTotal = 0;
  const allPayments = [];
  if (pendingTotal > 0) {
    for (let n = 0; n < dates.length; n++) {
      let quantity = Math.round(pieCacke * 100) / 100;
      if (n + 1 == dates.length) {
        quantity = pendingTotal - tmpTotal;
      }
      tmpTotal += quantity;
      allPayments.push({
        quantity: quantity,
        dueDate: moment(dates[n]).format('YYYY-MM-DD HH:mm:ss'),
        state: 'due',
        paymentType: typeId,
        refererApp: 'goufone',
        refererKey,
      });
    }
  }
  return allPayments;
};

export const createInvoicePaymentsForManualInvoice = async function (
  invoice: AnyModel,
) {
  const periodTypeId = invoice.paymentPeriodType;
  const periodType = periodTypeId
    ? await PaymentPeriodType.findOne({
        where: { id: periodTypeId },
      })
    : await PaymentPeriodType.findOne({
        where: { code: 'ONE' },
      });

  if (!periodType) {
    throw new Error(`Periods type not found (${periodTypeId})`);
  }

  const typeId = invoice.paymentType || -1;
  const invoicePaymentType = await InvoicePaymentType.findByPk(typeId);

  if (!invoicePaymentType) {
    throw new Error(`Payment type not found (${typeId})`);
  }

  //get dates of pay by invoice payment type and period type and pay date
  const dates = getPaymentDates(periodType, invoice.payDate);

  // get current peyments
  const actualPayments = await InvoicePayment.findAll({
    where: { invoiceId: invoice.id },
  });

  // calculate total of created payments
  let total = 0;
  for (const pay of actualPayments) {
    total += Number(pay.quantity);
  }
  const pendingTotal = Number(invoice.total) - Number(total);
  const pieCacke = pendingTotal / dates.length;
  let tmpTotal = 0;
  const allPayments = [...actualPayments];
  if (pendingTotal > 0) {
    for (let n = 0; n < dates.length; n++) {
      let quantity = Math.round(pieCacke * 100) / 100;
      if (n + 1 == dates.length) {
        quantity = pendingTotal - tmpTotal;
      }
      const code = await NumeraService.getNextCode('payment', null, true);
      tmpTotal += quantity;
      allPayments.push(
        await InvoicePayment.create({
          quantity: quantity,
          invoiceId: invoice.id,
          dueDate: moment(dates[n]).format('YYYY-MM-DD HH:mm:ss'),
          serieId: code.serieId,
          code: code.code,
          state: 'due',
          paymentType: typeId,
        }),
      );
    }
  }
  return allPayments;
};

export const periodsTypesByCode: Record<string, AnyModel> = {};
export const periodsTypesById: Record<string, AnyModel> = {};
export const initPeriodType = async (force = false) => {
  if (!Object.keys(periodsTypesById).length || force) {
    (await PaymentPeriodType.findAll()).forEach((peymentPeriodType) => {
      periodsTypesById[peymentPeriodType.id] = peymentPeriodType;
      periodsTypesByCode[peymentPeriodType.code] = peymentPeriodType;
    });
  }
};

export const invoicePaymentTypes: Record<string, AnyModel> = {};
export const initInvoicePaymentType = async (force = false) => {
  if (!Object.keys(invoicePaymentTypes).length || force) {
    (await InvoicePaymentType.findAll()).forEach((invoicePaymentType) => {
      invoicePaymentTypes[invoicePaymentType.id] = invoicePaymentType;
    });
  }
};
