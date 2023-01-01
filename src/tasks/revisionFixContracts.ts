import { CronJob } from 'cron';
import { handle as RevisionFixContracts } from '@api/service/intranet/Actions/RevisionFixContracts';
import config from '@config';

// cron job every 10 minutes
const period = config.get(
  'index.tasks.revisionFixContracts.period',
  '0 0 14,3 * * *',
);
const enabled = config.get('index.tasks.revisionFixContracts.enabled', false);

const job = new CronJob({
  onTick: async () => {
    await RevisionFixContracts();
    console.log('Task [CronJobs][revisionFixContracts] RAN.');
  },
  // runOnInit: true,
  cronTime: period,
});

if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.revisionFixContracts is disabled');
}
