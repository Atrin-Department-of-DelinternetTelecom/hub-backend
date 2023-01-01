'use strict';

const CronJob = require('cron').CronJob;
const {
  cutLast60DaysUnpaidInvoice,
} = require('@service/unpaid/UnpaidContractService');
const config = require('@config');

let running = false;

const enabled = config.get('index.tasks.cutUnpaidInvoices.enabled', false);
const period = config.get(
  'index.tasks.cutUnpaidInvoices.period',
  '0 */10 * * * *',
);

const job = new CronJob(period, async () => {
  if (running) {
    console.error(
      '[cutUnpaidInvoice]',
      'previous cutUnpaidInvoice cron job is already running',
    );
    return;
  }
  running = true;
  try {
    await cutLast60DaysUnpaidInvoice();
  } finally {
    running = false;
  }
});

if (enabled) job.start();
if (!enabled) {
  console.warn('tasks.cutUnpaidInvoices is disabled');
}
