import moment from 'moment';
import {
  Discount,
  PossbileCollection,
  Reason,
} from '../../GfDiscountsPendingService';
import { intranet } from '@models';
import { collectPendingDiscountsForClient } from './collectPendingDiscountsForClient';

const { GfDiscountsPending } = intranet;

/**
 * Synchronizes the discounts pending table with the current state of valid discounts.
 *
 * - Deactivates pending discounts that are no longer valid.
 * - Adds new valid discounts that are missing from the DB.
 */
export const syncPendingDiscountsWithContracts = async (
  clientId: number,
  discountMatrixId?: number,
  todayIs?: string,
): Promise<{
  reasons: Record<string, Reason[]>;
  exclusionReasons: Record<string, Reason[]>;
  pending: Discount[];
}> => {
  const evaluationDate = todayIs ? moment(todayIs) : moment();

  const { pendings, possibles, exclusionReasons } =
    await collectPendingDiscountsForClient(
      clientId,
      evaluationDate,
      discountMatrixId,
    );

  const recorded = await GfDiscountsPending.findAll({ where: { clientId } });

  const recordedKeys = new Set(recorded.map((r) => r.key));
  const pendingKeys = new Set(pendings.map((p) => p.key));

  // Disable outdated records
  const toDisable = recorded.filter((r) => !pendingKeys.has(r.key));
  await Promise.all(toDisable.map((r) => r.update({ status: 0 })));

  // Insert missing new pending discounts
  const toInsert = pendings.filter((p) => !recordedKeys.has(p.key));
  await Promise.all(toInsert.map(insertPendingDiscount(clientId)));

  return {
    pending: pendings,
    reasons: aggregateExclusionReasons(possibles),
    exclusionReasons,
  };
};

/**
 * Generates a creation function for a given client.
 */
const insertPendingDiscount =
  (clientId: number) =>
  (discount: Discount): Promise<any> =>
    GfDiscountsPending.create({
      key: discount.key,
      clientId,
      contractId: discount.base.contractId,
      matrixId: discount.base.matrixId,
      used: JSON.stringify(discount.used),
      ambiguos: discount.ambiguous ? 1 : 0,
    });

/**
 * Aggregates all exclusion reasons from a collection of possible discounts.
 */
export const aggregateExclusionReasons = (
  possibles: PossbileCollection,
): Record<string, Reason[]> => {
  return possibles.reduce((acc, possible) => {
    for (const contractId in possible.exclusionReasons) {
      if (!acc[contractId]) acc[contractId] = [];
      acc[contractId].push(...possible.exclusionReasons[contractId]);
    }
    return acc;
  }, {} as Record<string, Reason[]>);
};
