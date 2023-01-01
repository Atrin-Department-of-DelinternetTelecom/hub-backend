import { CronJob } from 'cron';
import { handle as RefreshRadiusLookup } from '@api/service/intranet/Actions/RefreshRadiusLookup';
import config from '@config';
import to from 'await-to-js';

// cron job every 10 minutes
const period = config.get(
  'index.tasks.refreshRadiusLookups.period',
  '0 20 */3 * * *',
);
const enabled = config.get('index.tasks.refreshRadiusLookups.enabled', false);

const job = new CronJob({
  onTick: async () => {
    console.log('Task [CronJobs][refreshRadiusLookups] RUNNING ...');
    console.time('Task [CronJobs][refreshRadiusLookups] RAN.');
    const [error] = await to(
      RefreshRadiusLookup(
        [],
        config.get('index.tasks.refreshRadiusLookups.perPage', 1000),
      ),
    );
    console.error(error);
    console.timeEnd('Task [CronJobs][refreshRadiusLookups] RAN.');
  },
  // runOnInit: true,
  cronTime: period,
});

if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.refreshRadiusLookups is disabled');
}
