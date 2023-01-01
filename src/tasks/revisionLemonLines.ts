import { CronJob } from 'cron';
import config from '@config';
import { revisionLemonLines } from '@api/service/intranet/ScheduleService';

// cron job every 10 minutes
const period = config.get(
  'index.tasks.revisionLemonLines.period',
  '0 0 21,9 * * *',
);
const enabled = config.get('index.tasks.revisionLemonLines.enabled', false);

const job = new CronJob({
  onTick: async () => {
    await revisionLemonLines();
    console.log('Task [CronJobs][revisionLemonLines] RAN.');
  },
  // runOnInit: true,
  cronTime: period,
});

if (enabled) job.start();
if (!enabled) {
  console.warn('tasks.revisionLemonLines is disabled');
}
