// @ts-check
'use strict';

import {
  updateInvoicePayment as updatePayment,
  deleteInvoicePayment as deletePayment,
  postInvoicePayment as createPayment,
  getInvoicePayment as paymentList,
} from '@service/intranet/InvoicePaymentService';
import { createRoute } from '@api/utils/controller-factory';
import { intranet, moozaic } from '@models';
const {
  InvoicePayment,
  GfInvoiceInvoice,
  InvoiceClient,
  InvoiceMoneyTypes,
  InvoiceRemitances,
  Warehouse,
  InvoicePaymentType,
} = intranet;
const { MoozaicUser } = moozaic;

import { errors } from '@api/http/http_errors';

export const postInvoicePayment = createRoute({
  handler(req) {
    const body = req.swagger.params.body.value;
    return createPayment(body);
  },
});

export const getInvoicePayment = createRoute({
  handler(req) {
    return paymentList(req.query);
  },
});

export const getInvoicePaymentId = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    const payment = await InvoicePayment.findByPk(id, {
      include: [
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
            {
              model: InvoiceClient,
              as: 'invoice_client',
              required: false,
            },
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
        {
          model: MoozaicUser,
          as: 'setPaidUser',
          required: false,
        },
        {
          model: Warehouse,
          as: 'shop',
          required: false,
        },
      ],
    });

    if (!payment) throw new errors.NotFound('invoice payment not found!');

    return payment;
  },
});

export const updateInvoicePayment = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    const body = req.swagger.params.body.value;
    const userId = req.user.userId;

    const invoicePayment = await InvoicePayment.findByPk(id);
    if (!invoicePayment)
      throw new errors.NotFound('invoice payment not found!');

    return updatePayment(invoicePayment, body, userId);
  },
});

export const deleteInvoicePayment = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    const invoicePayment = await InvoicePayment.findByPk(id);
    if (!invoicePayment)
      throw new errors.NotFound('invoice payment not found!');

    return deletePayment(invoicePayment);
  },
});
