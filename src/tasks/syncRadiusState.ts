import { CronJob } from 'cron';
import { handle as SyncRadiusState } from '@api/service/intranet/Actions/SyncRadiusState';
import config from '@config';

// cron job every 10 minutes
const period = config.get('index.tasks.syncRadiusState.period', '0 40 * * * *');
const enabled = config.get('index.tasks.syncRadiusState.enabled', false);

const job = new CronJob({
  onTick: async () => {
    await SyncRadiusState();
    console.log('Task [CronJobs][syncRadiusState] RAN.');
  },
  // runOnInit: true,
  cronTime: period,
});

if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.syncRadiusState is disabled');
}
