import { CONTRACT } from '@api/constants/statuses';
import { CronJob } from 'cron';
import config from '@config';
import { ensureOfContractDocuments } from '@api/service/intranet/ScheduleService';
import { intranet } from '@lib/knex';
import { pluck } from '@api/utils/collections';

// cron job every 10 minutes
const period = config.get(
  'index.tasks.syncContractDocuments.period',
  '0 0 0 * * *',
);
const enabled = config.get('index.tasks.syncContractDocuments.enabled', false);

const job = new CronJob({
  onTick: async () => {
    console.log('Task [CronJobs][syncContractDocuments] RUNNING.');
    const missing = await intranet
      .table('gf_contracts')
      .where('status', 1)
      .where('state', '!=', CONTRACT.SUSPENDED)
      .whereNotExists(
        intranet
          .table('gf_docs')
          .whereRaw('gf_docs.contractId = gf_contracts.id'),
      )
      .whereNotExists(
        intranet
          .table('gf_contract_data_subscription')
          .whereRaw(
            'gf_contract_data_subscription.contractId = gf_contracts.id',
          ),
      )
      .select('gf_contracts.id');

    if (missing.length > 0) {
      console.log(
        `Task [CronJobs][syncContractDocuments] found ${missing.length} contracts to generate document.`,
      );
      await ensureOfContractDocuments(pluck(missing, 'id'));
    } else {
      console.log('Not contracts found to generate document.');
    }
  },
  // runOnInit: true,
  cronTime: period,
});

if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.syncContractDocuments is disabled');
}
