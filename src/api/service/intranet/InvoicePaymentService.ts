'use strict';

import { AnyModel, intranet } from '@models';

const {
  InvoicePayment,
  GfInvoiceInvoice,
  InvoiceRemitances,
  InvoicePaymentType,
  InvoiceMoneyTypes,
  GfInvoiceControl,
  InvoiceClient,
  Warehouse,
} = intranet;

import { respondCreated } from '@utils/response';
import { errors } from '@api/http/http_errors';

import { getAllEntities, findAndGet } from '@utils/request-handler';

import moment from 'moment';

import NumeraService from '@service/intranet/NumeraService';
import { getMoozaicOnlinPaymentType } from '@service/intranet/PaymentService';
import { consolidePayments } from '@service/intranet/InvoiceInvoiceService';
import Invoice_GfInvoiceControlService from './Invoice_GfInvoiceControlService';
import assert from 'assert';

export const postInvoicePayment = async function (body: any) {
  if (body.code == '') {
    const code = await NumeraService.getNextCode('payment', body.serieId);
    body.code = code.code;
    body.serieId = code.serieId;
  }

  const payment = await InvoicePayment.create(body);
  if (body.invoiceId) await consolidePayments(body.invoiceId);

  return respondCreated(payment);
};

export const updateInvoicePayment = async function (
  invoicePayment: AnyModel,
  body: any,
  userId: number,
) {
  const old = invoicePayment.get({ plain: true });

  const { remitanceId, paymentType, shopId } = body;
  if (remitanceId) {
    // part of a remitance
    const remitance = await InvoiceRemitances.findByPk(remitanceId);

    if (remitance && remitance.state != 'pending')
      throw new errors.BadRequest(
        "Payment cannot be modified, it's part of a remitance",
      );
  }

  //validate shopId if exist
  if (shopId) {
    const warehouse = await Warehouse.findByPk(shopId);
    if (!warehouse)
      throw new errors.NotFound(`shop with id ${shopId} not found`);
  }

  if (
    body.dueDate &&
    moment(old.dueDate).unix() !== moment(body.dueDate).unix()
  )
    throw new errors.BadRequest(`dueDate cannot be modified`);

  if (body.paymentType && old.paymentType !== body.paymentType)
    throw new errors.BadRequest(`payment type cannot be modified`);

  const onlinePaymentType = await getMoozaicOnlinPaymentType();
  assert(onlinePaymentType, 'online payment entity not found');

  if (
    old.paymentType == onlinePaymentType.id &&
    paymentType != onlinePaymentType.id
  )
    throw new errors.BadRequest(`paymentType: Cannot change from TPV online`);

  if (
    old.paymentType != onlinePaymentType.id &&
    paymentType == onlinePaymentType.id
  )
    throw new errors.BadRequest(`paymentType: Cannot change to TPV online`);

  delete body.setPaidUserId;
  await invoicePayment.update(body);
  if (old.state === 'due' && body.state === 'paid') {
    if (!shopId) throw new errors.BadRequest(`shopId required`);
    body.setPaidUserId = userId;
  }

  if (invoicePayment.invoiceId)
    await consolidePayments(invoicePayment.invoiceId);

  const keys = parseRefererKey(old.refererKey);
  if (keys.gfClient && keys.periodId) {
    const controlRow = await GfInvoiceControl.findOne({
      where: { periodId: keys.periodId, clientId: keys.gfClient },
    });
    Invoice_GfInvoiceControlService.consolideControl(controlRow);
  }
  return findAndGet(invoicePayment.id, InvoicePayment);
};

export const deleteInvoicePayment = async function (invoicePayment: AnyModel) {
  if (invoicePayment.state != 'due')
    throw new errors.BadRequest(`Payment cannot be deleted`);

  if (invoicePayment.remitanceId) {
    const remitance = await InvoiceRemitances.findByPk(
      invoicePayment.remitanceId,
    );
    assert(remitance, 'remitance not found');

    if (remitance.state != 'pending')
      throw new errors.BadRequest(
        "Payment cannot be modified, it's part of a remitance",
      );
  }

  invoicePayment.status = 0;
  await invoicePayment.save();

  if (invoicePayment.invoiceId)
    await consolidePayments(invoicePayment.invoiceId);

  return `InvoicePayment with id:${invoicePayment.id} has been deleted`;
};

export const getInvoicePayment = async function (query: any) {
  return getAllEntities(query, InvoicePayment, undefined, [
    {
      model: InvoicePaymentType,
      as: 'payment_type',
      required: false,
    },
    {
      model: GfInvoiceInvoice,
      as: 'invoice',
      required: false,
      include: [
        { model: InvoiceClient, as: 'invoice_client', required: false },
      ],
    },
    {
      model: InvoiceMoneyTypes,
      as: 'money_type',
      required: false,
    },
    {
      model: InvoiceRemitances,
      as: 'invoice_remitance',
      required: false,
    },
  ]);
};

export const restorePaymentsShipmentState = async function (
  remitanceId: number,
) {
  return InvoicePayment.update(
    {
      state: 'due',
    },
    {
      where: {
        state: 'shiped',
        remitanceId: remitanceId,
      },
    },
  );
};

export const parseRefererKey = (referers: string | null) => {
  const finalObject: Record<string, string> = {};
  if (referers) {
    const splitedReferers = referers.split(',');
    for (let referer of splitedReferers) {
      referer = referer.replace(']', '');
      referer = referer.replace('[', '');
      const parts = referer.split(':');
      const key = parts[0];
      const value = parts[1];
      finalObject[key] = value;
    }
  }
  return finalObject;
};
