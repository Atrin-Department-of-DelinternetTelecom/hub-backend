'use strict';

const {
  intranet: { InvoicePayment, InvoiceRemitances },
} = require('@models');

const { Op } = require('sequelize');

const CounterService = require('../service/global/CounterService');
const {
  consolidePayments,
} = require('@api/service/intranet/InvoiceInvoiceService');

const { default: to } = require('await-to-js');

module.exports = async function _setConfirmedTanda(params, bulk) {
  const { paymentIds, remitanceId } = params;

  await InvoicePayment.update(
    {
      state: 'paid',
    },
    {
      where: {
        id: { [Op.in]: paymentIds },
      },
    },
  );

  const payments = await InvoicePayment.findAll({ where: { id: paymentIds } });
  for (const payment of payments)
    await to(consolidePayments(payment.invoiceId));

  await CounterService.tick(
    `remitance_confirmed_${remitanceId}`,
    paymentIds.length,
  );
  const counter = await CounterService.getCounter(
    `remitance_confirmed_${remitanceId}`,
  );

  if (counter.value === counter.max) {
    const remitance = await InvoiceRemitances.findByPk(remitanceId);
    remitance.state = 'confirmed';
    await remitance.save();
  }

  return { success: true };
};
