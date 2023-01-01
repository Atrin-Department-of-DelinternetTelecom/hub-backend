Here's an improved version of your documentation:

````markdown
## CRON Jobs

Our system interacts with various third-party applications, requiring scheduled tasks to keep the system data up to date. To achieve this, we have implemented several CRON jobs that automate these processes.

This section provides an overview of the existing CRON jobs, including their purposes and use cases within the system.

### How It Works

Our CRON jobs are implemented using the Node.js `cron` package. Each CRON job consists of two main components: **tasks** and **actions**.

#### Tasks

A task is the core component of a CRON job. All tasks are located in the `src/api/tasks` directory as TypeScript (`.ts`) files. A typical task is structured as follows:

```typescript
import { CronJob } from 'cron';
import config from '@config';

// CRON job scheduled to run every 10 minutes
const period = config.get(
  'index.tasks.checkExecutedStates.period',
  '0 */10 * * * *',
);
const enabled = config.get('index.tasks.checkExecutedStates.enabled', false);

console.log(enabled);

const job = new CronJob({
  onTick: async () => {
    // Main scheduled operation
  },
  cronTime: period,
});

if (enabled) job.start();
else console.warn('tasks.checkExecutedStates is disabled');
```
````

#### Actions

In some scenarios, it may be necessary to store data to execute actions at a later time. For such cases, **actions** are implemented.

Each action involves two database tables that track their operations: `global_bulk` and `global_action`. A bulk contains multiple actions to be executed.

To create a bulk and its corresponding actions, use the following approach:

```typescript
import actionRunner from '@lib/action-runner';

// Schedule bulk
actionRunner.createBulk(
  {
    creator_id: 0,
    name: BULK_NAME,
  },
  ActionsArray: [{
    params,
    name: RELATED_ACTION_FILE_NAME
  }]
);
```

Each bulk must have a unique `name`, and its associated actions must also have unique names. Additionally, each action must correspond to a TypeScript file stored in the `src/api/actions` directory, which contains the action logic:

```typescript
import { AireRequestLine } from '@api/service/intranet/AireService';

export default async function importAirRequestsAction(params: {
  page: number;
  pageSize: number;
}): Promise<void> {
  // Action logic
}
```

### Available CRON Jobs

Below is a list of the currently implemented CRON jobs in the system:

- `checkExecutedStates`
- `checkFirstConnection`
- `cutUnpaidInvoice`
- `dispatchOutboundEvents`
- `executekamailios`
- `importAireLines`
- `importAireRequests`
- `importFees`
- `index`
- `loadMobileCdr`
- `loadUnpaidXmls`
- `pendingTechnicianTasks`
- `processScheduledSuspensions`
- `refreshCpeLookups`
- `refreshIvozLookups`
- `refreshRadiusLookups`
- `revisionCellContracts`
- `revisionFixContracts`
- `revisionLandlines`
- `revisionLemonLines`
- `sendUnpaidNotifications`
- `suspendPendingContracts`
- `suspendUnpaidCustomers`
- `syncRadiusState`
- `updateGeoCities`
- `updateGeoNumbers`
- `updateGeoProvinces`
- `updateGeoStreets`

#### `suspendUnpaidCustomers`

This CRON job is designed to suspend contracts that have unpaid invoices for the last three months.

To enable it, set the `SUSPEND_UNPAID_CUSTOMERS_ENABLED` environment variable to `true`.  
To customize the scheduling period, set the `SUSPEND_UNPAID_CUSTOMERS_PERIOD` variable using a valid CRON expression.

```

```
