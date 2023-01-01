import { AnyModel, intranet } from '@api/models';

import { CronJob } from 'cron';
import { chunk } from 'lodash';
import config from '@config';
import { destoryGfContractsId } from '@api/service/intranet/GfContractService';

const { GfContract } = intranet;

// cron job every 10 minutes
const period = config.get(
  'index.tasks.suspendPendingContracts.period',
  '0 0 14,3 * * *',
);
const enabled = config.get(
  'index.tasks.suspendPendingContracts.enabled',
  false,
);

const job = new CronJob({
  onTick: async () => {
    const pendingDays = config.get(
      'index.tasks.suspendPendingContracts.pendingDays',
      30,
    );
    const pendingContracts: AnyModel[] = await GfContract.getPendingContracts(
      pendingDays,
    );

    for (const contracts of chunk(pendingContracts, 10)) {
      console.warn(
        `Suspending: Exceeded Pending Time Limit [${pendingDays} days]: ${JSON.stringify(
          contracts.map(({ id }) => id),
        )}`,
      );

      const suspensions = await Promise.allSettled(
        contracts.map(({ id }) => destoryGfContractsId(id, { userId: 0 })),
      );

      suspensions.forEach((res) => {
        if (res.status === 'rejected') console.error(res.reason);
      });
    }

    console.log('Task [CronJobs][suspendPendingContracts] RAN.');
  },
  // runOnInit: true,
  cronTime: period,
});

enabled
  ? job.start()
  : console.warn('tasks.suspendPendingContracts is disabled');
