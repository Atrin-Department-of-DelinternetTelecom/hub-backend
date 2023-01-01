import { intranet, system } from '@lib/knex';

import { CronJob } from 'cron';
import { cached } from '@api/service/documents/cache';
import config from '@config';
import { ensureOfDocumentPackageCaches } from '@api/service/intranet/ScheduleService';
import { normalizeId } from '@api/service/documents/DocumentService';
import { pluck } from '@api/utils/collections';

// cron job every 10 minutes
const period = config.get(
  'index.tasks.syncContractDocumentPackages.period',
  '0 0 0 * * *',
);
const enabled = config.get(
  'index.tasks.syncContractDocumentPackages.enabled',
  false,
);

const docsQuery = () => {
  return intranet
    .table('gf_docs')
    .where('gf_docs.status', 1)
    .whereNotNull('contractId')
    .whereExists(
      intranet
        .table('gf_contracts')
        .where('gf_contracts.status', 1)
        .whereRaw('gf_contracts.id = gf_docs.contractId'),
    );
};

const job = new CronJob({
  onTick: async () => {
    const exists = await system
      .table('global_bulks')
      .where('name', 'ensure-of-document-package-caches')
      .where('status', 'running')
      .first();

    if (exists) {
      console.log(
        'An [CronJobs][syncContractDocumentPackages] task is running.',
      );

      return;
    }

    console.log('Task [CronJobs][syncContractDocumentPackages] RUNNING.');
    const docs = await docsQuery().orderBy('id', 'desc').select('gf_docs.id');
    const packages = pluck(docs, 'id').map((id) => normalizeId(id));
    const missing = [];

    for (const packageId of packages) {
      if (await cached(packageId)) {
        continue;
      }
      // cache not found
      missing.push(packageId);
    }

    if (missing.length > 0) {
      console.log(
        `Task [CronJobs][syncContractDocumentPackages] found ${missing.length} contracts to generate document.`,
      );
      await ensureOfDocumentPackageCaches(missing);
    } else {
      console.log('Not contracts found to generate document.');
    }
  },
  // runOnInit: true,
  cronTime: period,
});

if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.syncContractDocumentPackages is disabled');
}
