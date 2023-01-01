import config from '@config';
import { checkFirstConnection } from '@service/intranet/GfContractInternetService';
import { CronJob } from 'cron';

// cron job every 10 minutes
const period = config.get(
  'index.tasks.checkFirstConnection.period',
  '0 */10 * * * *',
);
const enabled = config.get('index.tasks.checkFirstConnection.enabled', false);

const job = new CronJob(period, async () => {
  const result = await checkFirstConnection();
  console.log('[CronJobs][checkFirstConnection]', result);
});

if (enabled) job.start();
if (!enabled) {
  console.warn('tasks.checkFirstConnection is disabled');
}
