import { CronJob } from 'cron';
import { handle as ProcessScheduledSuspensions } from '@api/service/intranet/Actions/ProcessScheduledSuspensions';
import config from '@config';

// cron job every 10 minutes
const period = config.get(
  'index.tasks.scheduledSuspensions.period',
  '0 0 * * * *',
);
const enabled = config.get('index.tasks.scheduledSuspensions.enabled', false);

const job = new CronJob({
  onTick: async () => {
    console.log('Task [CronJobs][scheduledSuspensions] RUNNING ...');
    await ProcessScheduledSuspensions();
    console.log('Task [CronJobs][scheduledSuspensions] RAN.');
  },
  // runOnInit: true,
  cronTime: period,
});

if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.scheduledSuspensions is disabled');
}
