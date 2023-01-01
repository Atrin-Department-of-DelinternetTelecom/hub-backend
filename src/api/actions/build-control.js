'use strict';

const Invoice_GfInvoiceControlService = require('../service/intranet/Invoice_GfInvoiceControlService');
const { GfInvoicePeriod } = require('@models').intranet;
const CounterService = require('../service/global/CounterService');

/**
 * @param {{ periodId: number, tandas: number }} params
 */
module.exports = async function buildPartialControls(params, bulk) {
  console.log('build control job started', params);
  const { periodId, from, size, as_comparative, n, tandas } = params;
  await Invoice_GfInvoiceControlService.buildPartialControls(
    periodId,
    from,
    size,
    as_comparative,
  );
  await CounterService.tick(
    'Invoice_GfPeriodsManager_controlRowsTanda_' + periodId,
  );

  const counter = await CounterService.getCounter(
    'Invoice_GfPeriodsManager_controlRowsTanda_' + periodId,
  );
  if (counter.max === counter.value) {
    const period = await GfInvoicePeriod.findByPk(periodId);
    period.controlRows = 'done';
    await period.save();
  }
};
