import { CronJob } from 'cron';
import { handle as RefreshIvozLookup } from '@api/service/intranet/Actions/RefreshIvozLookup';
import config from '@config';
import to from 'await-to-js';

// cron job every 10 minutes
const period = config.get(
  'index.tasks.refreshIvozLookups.period',
  '0 30 */3 * * *',
);
const enabled = config.get('index.tasks.refreshIvozLookups.enabled', false);

const job = new CronJob({
  onTick: async () => {
    console.log('Task [CronJobs][refreshIvozLookups] RUNNING ...');
    console.time('Task [CronJobs][refreshIvozLookups] RAN.');
    const [error] = await to(RefreshIvozLookup());
    console.error(error);
    console.timeEnd('Task [CronJobs][refreshIvozLookups] RAN.');
  },
  // runOnInit: true,
  cronTime: period,
});

if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.refreshIvozLookups is disabled');
}
