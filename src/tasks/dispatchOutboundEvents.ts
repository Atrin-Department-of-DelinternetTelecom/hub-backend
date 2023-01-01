import { CronJob } from 'cron';
import { handle as RevisionOutboundPortabilities } from '@api/service/intranet/Actions/RevisionOutboundPortabilities';
import config from '@config';

// cron job every 10 minutes
const period = config.get(
  'index.tasks.revisionOutboundEvents.period',
  '0 0 14,3 * * *',
);
const enabled = config.get('index.tasks.revisionOutboundEvents.enabled', false);

const job = new CronJob({
  onTick: async () => {
    await RevisionOutboundPortabilities();
    console.log('Task [CronJobs][revisionOutboundEvents] RAN.');
  },
  // runOnInit: true,
  cronTime: period,
});

if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.revisionOutboundEvents is disabled');
}
