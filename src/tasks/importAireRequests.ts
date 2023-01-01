import { CronJob } from 'cron';
import config from '@config';
import { importAireRequests } from '@api/service/intranet/ScheduleService';

// cron job every 10 minutes
const period = config.get(
  'index.tasks.importAireRequests.period',
  '0 0 23,11 * * *',
);
const enabled = config.get('index.tasks.importAireRequests.enabled', false);

const job = new CronJob({
  onTick: async () => {
    await importAireRequests();
    console.log('Task [CronJobs][importAireRequests] RAN.');
  },
  // runOnInit: true,
  cronTime: period,
});

if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.importAireRequests is disabled');
}
