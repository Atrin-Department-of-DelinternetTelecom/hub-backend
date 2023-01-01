import { CronJob } from 'cron';
import { checkExecutedStates } from '@service/intranet/GfContractInternetService';
import config from '@config';

// cron job every 10 minutes
const period = config.get(
  'index.tasks.checkExecutedStates.period',
  '0 */10 * * * *',
);
const enabled = config.get('index.tasks.checkExecutedStates.enabled', false);
console.log(enabled);
const job = new CronJob({
  onTick: async () => {
    console.log('Task [CronJobs][checkExecutedStates] RUNNING.');
    await checkExecutedStates();
    console.log('Task [CronJobs][checkExecutedStates] RAN.');
  },
  // runOnInit: true,
  cronTime: period,
});

if (enabled) job.start();
if (!enabled) {
  console.warn('tasks.checkExecutedStates is disabled');
}
