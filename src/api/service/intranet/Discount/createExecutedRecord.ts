import moment from 'moment';
import { AnyModel, intranet } from '@models';
const { GfDiscountsExecuted, GfDiscountsExecutedUsage } = intranet;

export interface ShuffledPossible {
  type: string;
  typeId: number;
  ruleId?: number;
}

export const createExecutedRecord = async (
  pending: AnyModel,
  todayIs?: string,
  onlyExecute = false,
): Promise<AnyModel> => {
  const executed = await GfDiscountsExecuted.create({
    targetContractId: pending.contractId,
    matrixId: pending.matrixId,
    init: todayIs ?? moment().format('YYYY-MM-DD HH:mm:ss'),
    active: 1,
    combinationExecutedTask: onlyExecute,
    status: !onlyExecute,
  });

  const useds: ShuffledPossible[] = JSON.parse(pending.used || '[]');

  await Promise.all(
    useds.map((used) =>
      GfDiscountsExecutedUsage.create({
        executedId: executed.id,
        type: used.type,
        typeId: used.typeId,
        ruleId: used.ruleId,
      }),
    ),
  );

  return executed;
};
