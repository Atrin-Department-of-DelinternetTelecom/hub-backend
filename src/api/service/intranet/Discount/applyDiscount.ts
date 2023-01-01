import { AnyModel } from '@models';

import { validatePendingDiscount } from './validatePendingDiscount';
import { createExecutedRecord } from './createExecutedRecord';
import { disablePreviousExecutions } from './disablePreviousExecutions';
import { createScheduledOrBonoDiscounts } from './createScheduledOrBonoDiscounts';

export const applyDiscount = async (
  pending: AnyModel,
  evenInactive = false,
  todayIs?: string,
  userId?: number,
  excuteOption?: { onlyExecute?: boolean; disableExecuteIds?: number[] },
): Promise<{
  executedId: number;
  scheduled: AnyModel[];
  bonoAdded?: AnyModel;
}> => {
  const isFakeDate = !!todayIs;
  const { onlyExecute = false, disableExecuteIds = [] } = excuteOption ?? {};

  // Validation
  todayIs = await validatePendingDiscount(pending, evenInactive, todayIs);

  // record execution
  const executed = await createExecutedRecord(pending, todayIs, onlyExecute);

  if (disableExecuteIds?.length) {
    await disablePreviousExecutions(disableExecuteIds, todayIs, userId);
  }

  let scheduled: Array<AnyModel> = [];
  let addedBono: AnyModel | undefined;

  if (!onlyExecute) {
    const result = await createScheduledOrBonoDiscounts({
      contract: pending.contract,
      pending,
      matrix: pending.matrix,
      executedId: executed.id,
      isFakeDate,
      userId,
    });

    scheduled = result.scheduled;
    addedBono = result.addedBono;
  }

  // remove pending row
  await pending.update({ status: 0 });

  return {
    executedId: executed.id,
    scheduled: scheduled,
    bonoAdded: addedBono,
  };
};
