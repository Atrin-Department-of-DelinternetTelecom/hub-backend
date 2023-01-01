import { AnyModel } from '@models';
import { applyDiscount } from './applyDiscount';

interface ProcessNextPossibleParams {
  possible: AnyModel;
  discountMatrixId?: number;
  todayIs?: string;
  userId?: number;
  activeCombinations: Record<string, any[]>;
  activeCombinationNodes: any;
}

export const evaluateToApplyDiscount = async ({
  possible,
  discountMatrixId,
  todayIs,
  userId,
  activeCombinations,
  activeCombinationNodes,
}: ProcessNextPossibleParams): Promise<{
  executedId: number;
  scheduledRows: AnyModel[];
  bonoAdded?: AnyModel;
} | null> => {
  const matrixId = possible.matrixId;
  const disableExecuteIds: number[] = [];
  let onlyExecute = false;

  if (activeCombinationNodes[matrixId]?.length) {
    onlyExecute = true;
    activeCombinationNodes[matrixId].pop();
  }

  // TODO: Handle priority between overlapping discounts (e.g. bigger vs. smaller).
  //
  // Before applying a new (bigger) discount, identify if it conflicts with an existing (smaller) one.
  // The smaller discount might already be partially applied and should be allowed to finish its promotion period.
  //
  // Be cautious: simply replacing it with the bigger discount (especially with force execution
  // using the contract's activation date) might incorrectly restart from the beginning of the month,
  // which is not intended behavior.
  //
  // Ideal flow:
  // - Detect partial usage of the smaller discount.
  // - Decide whether to continue or replace it based on promotion rules.
  // - Avoid overriding active discounts unless you're sure they’re no longer valid.
  const combinations = activeCombinations[String(matrixId)];
  if (combinations?.length) {
    disableExecuteIds.push(
      ...combinations
        .filter((c) => c.reference === 'executed')
        .map((c) => c.id),
    );
  }

  try {
    const result = await applyDiscount(
      possible,
      discountMatrixId === matrixId,
      todayIs,
      userId,
      { onlyExecute, disableExecuteIds },
    );

    return {
      executedId: result.executedId,
      scheduledRows: result.scheduled,
      bonoAdded: result.bonoAdded,
    };
  } catch (error) {
    console.error('Failed to execute discount:', error);
    return null;
  }
};
