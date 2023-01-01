import { CronJob } from 'cron';
import config from '@config';
import { suspendUnpaidCustomers } from '@api/service/intranet/GfContractService';

// cron job every 10 minutes
const period = config.get(
  'index.tasks.suspendUnpaidCustomers.period',
  '0 0 * * * *', // every one hour
);
const enabled = config.get('index.tasks.suspendUnpaidCustomers.enabled', false);

let running = false;

const job = new CronJob(period, async () => {
  if (running) {
    console.error(
      '[suspendUnpaidCustomers]',
      'previous suspendUnpaidCustomers cron job is already running',
    );
    return;
  }

  console.log('[TASK][suspendUnpaidCustomers] started');

  running = true;

  try {
    await suspendUnpaidCustomers();
  } finally {
    running = false;
  }

  console.log('[TASK][suspendUnpaidCustomers] finished');
});

if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.suspendUnpaidCustomers is disabled');
}
