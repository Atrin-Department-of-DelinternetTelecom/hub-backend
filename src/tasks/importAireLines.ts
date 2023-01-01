import { CronJob } from 'cron';
import config from '@config';
import { importAireLines } from '@api/service/intranet/ScheduleService';

// cron job every 10 minutes
const period = config.get(
  'index.tasks.importAireLines.period',
  '0 0 22,10 * * *',
);
const enabled = config.get('index.tasks.importAireLines.enabled', false);

const job = new CronJob({
  onTick: async () => {
    await importAireLines();
    console.log('Task [CronJobs][importAireLines] RAN.');
  },
  // runOnInit: true,
  cronTime: period,
});

if (enabled) job.start();
if (!enabled) {
  console.warn('tasks.importAireLines is disabled');
}
