import { CronJob } from 'cron';
import { handle as RefreshCpeLookups } from '@api/service/intranet/Actions/RefreshCpeLookups';
import config from '@config';
import to from 'await-to-js';

// cron job every 10 minutes
const period = config.get(
  'index.tasks.refreshCpeLookups.period',
  '0 30 */3 * * *',
);
const enabled = config.get('index.tasks.refreshCpeLookups.enabled', false);

const job = new CronJob({
  onTick: async () => {
    console.log('Task [CronJobs][refreshCpeLookups] RUNNING ...');
    console.time('Task [CronJobs][refreshCpeLookups] RAN.');
    const [error] = await to(RefreshCpeLookups());
    console.error(error);
    console.timeEnd('Task [CronJobs][refreshCpeLookups] RAN.');
  },
  // runOnInit: true,
  cronTime: period,
});

if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.refreshCpeLookups is disabled');
}
