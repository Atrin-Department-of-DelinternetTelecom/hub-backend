import { CronJob } from 'cron';
import config from '@config';
import { revisionCellContracts } from '@api/service/intranet/ScheduleService';

// cron job every 10 minutes
const period = config.get(
  'index.tasks.revisionCellContracts.period',
  '0 0 14,3 * * *',
);
const enabled = config.get('index.tasks.revisionCellContracts.enabled', false);

const job = new CronJob({
  onTick: async () => {
    await revisionCellContracts();
    console.log('Task [CronJobs][revisionCellContracts] RAN.');
  },
  // runOnInit: true,
  cronTime: period,
});

if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.revisionCellContracts is disabled');
}
