import { CronJob } from 'cron';
import { handle as ImportAireBonuses } from '@api/service/intranet/Actions/ImportAireBonuses';
import { handle as ImportAireTarifas } from '@api/service/intranet/Actions/ImportAireTarifas';
import { handle as ImportLemonTarifas } from '@api/service/intranet/Actions/ImportLemonTarifas';
import { handle as SyncAireBonusInvoiceProducts } from '@api/service/intranet/Actions/SyncAireBonusInvoiceProducts';
import { handle as SyncProviderFees } from '@api/service/intranet/Actions/SyncProviderFees';
import config from '@config';

// cron job every 10 minutes
const period = config.get(
  'index.tasks.importfeesAction.period',
  '0 30 1 * * *',
);
const enabled = config.get('index.tasks.importfeesAction.enabled', false);

const job = new CronJob({
  onTick: async () => {
    console.log('Task [CronJobs][importfeesAction] RUNNING.');
    await ImportAireTarifas();
    await ImportLemonTarifas();
    await ImportAireBonuses();
    await SyncProviderFees();
    await SyncAireBonusInvoiceProducts();
    console.log('Task [CronJobs][importfeesAction] RAN.');
  },
  // runOnInit: true,
  cronTime: period,
});

if (enabled) job.start();

if (!enabled) {
  console.warn('tasks.importfeesAction is disabled');
}
