import moment from 'moment';
import { AnyModel } from '@models';
import { throwIf } from '@utils/helpers';
import DiscountingPackageService from '@api/service/DiscountingPackageService';

/**
 * Validates the pending discount before execution.
 * May adjust the `todayIs` date if force execution is triggered.
 */
export const validatePendingDiscount = async (
  pending: AnyModel,
  evenInactive = false,
  todayIs?: string,
): Promise<string | undefined> => {
  throwIf(!pending, 'Pending discount deleted');

  if (!pending.matrix.isActive() && !evenInactive) {
    throw new Error('Discount not active');
  }

  await DiscountingPackageService.canExecute(
    pending.matrixId,
    pending.contractId,
  );

  const reached = await pending.matrix.reachedAccumulation(pending.contractId);
  throwIf(reached, 'max_accumulation_exced');

  if (
    pending.matrix.forceExecution() &&
    moment(pending.contract.dateActivation).month() === moment().month()
  ) {
    return pending.contract.dateActivation;
  }

  return todayIs;
};
