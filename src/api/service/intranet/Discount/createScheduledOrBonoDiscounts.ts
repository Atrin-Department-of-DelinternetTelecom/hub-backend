import { AnyModel, intranet } from '@models';
import {
  getBonoDiscountsRows,
  getScheduledDiscountRows,
} from '../GfDiscountsExecuteService';
import GfDiscountsService from '../GfDiscountsService';

const { GfDiscountsHistory } = intranet;

interface RecordScheduledOptions {
  contract: AnyModel;
  pending: AnyModel;
  matrix: AnyModel;
  executedId: number;

  isFakeDate: boolean;
  userId?: number;
}

export const createScheduledOrBonoDiscounts = async ({
  contract,
  pending,
  matrix,
  executedId,
  isFakeDate,
  userId,
}: RecordScheduledOptions): Promise<{
  scheduled: AnyModel[];
  addedBono?: AnyModel;
}> => {
  const keyGroup = String(
    await GfDiscountsService.getKeyGroupFromExecuted(executedId),
  );

  if (matrix.discountType === 'bono') {
    const addedBono = await getBonoDiscountsRows(
      contract,
      pending,
      matrix,
      executedId,
      keyGroup,
      userId,
    );
    return { scheduled: [], addedBono };
  }

  const scheduled = await getScheduledDiscountRows({
    contract,
    pending,
    matrix,
    executedId,
    keyGroup,
    isFakeDate,
    userId,
  });

  await GfDiscountsHistory.update(
    { userId },
    { where: { scheduledId: scheduled.map((item) => item.id) } },
  );

  return { scheduled, addedBono: undefined };
};
