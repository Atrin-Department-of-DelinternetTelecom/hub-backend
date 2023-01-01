import moment from 'moment';
import { intranet } from '@models';
import { updateDiscount } from '../GfDiscountsScheduledService';
import { DISCOUNT_SCHEDULED } from '@api/constants/statuses';
const { GfDiscountsExecuted, GfDiscountsExecutedUsage, GfDiscountsScheduled } =
  intranet;

export const disablePreviousExecutions = async (
  executedIds: number[],
  todayIs?: string,
  userId?: number,
): Promise<void> => {
  if (!executedIds?.length) return;

  const timestamp = todayIs ?? moment().format('YYYY-MM-DD HH:mm:ss');

  // 1. Deactivate Executed rows
  await GfDiscountsExecuted.update(
    {
      active: 0,
      end: timestamp,
    },
    { where: { id: executedIds } },
  );

  // 2. Deactivate Executed Usages
  await GfDiscountsExecutedUsage.update(
    { status: 0 },
    { where: { executedId: executedIds } },
  );

  // 3. Cancel Scheduled Discounts
  const discounts = await GfDiscountsScheduled.findAll({
    where: { executedId: executedIds },
  });

  if (userId) {
    await Promise.all(
      discounts.map((discount) =>
        updateDiscount(
          discount,
          { state: DISCOUNT_SCHEDULED.CANCELED },
          { userId },
        ),
      ),
    );
  } else {
    await GfDiscountsScheduled.update(
      { state: DISCOUNT_SCHEDULED.CANCELED },
      { where: { executedId: executedIds } },
    );
  }
};
