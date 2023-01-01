import { CronJob } from 'cron';
import config from '@config';
import { revisionLandlines } from '@api/service/intranet/ScheduleService';

// cron job every 10 minutes
const period = config.get(
  'index.tasks.revisionLandlines.period',
  '0 0 14,3 * * *',
);
const enabled = config.get('index.tasks.revisionLandlines.enabled', false);

const job = new CronJob({
  onTick: async () => {
    await revisionLandlines();
    console.log('Task [CronJobs][revisionLandlines] RAN.');
  },
  // runOnInit: true,
  cronTime: period,
});

if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.revisionLandlines is disabled');
}
