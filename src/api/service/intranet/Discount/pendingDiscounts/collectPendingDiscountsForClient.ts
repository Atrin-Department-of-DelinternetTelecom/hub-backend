import moment from 'moment';
import {
  Discount,
  PossbileCollection,
  Reason,
  getClientActiveContracts,
  hasDiscountsPending,
  getPendingfromPossibles,
  getAmbiguouses,
  Pending,
} from '../../GfDiscountsPendingService';
import { AnyModel } from '@models';

/**
 * Entry point for collecting valid pending discounts for a client.
 */
export const collectPendingDiscountsForClient = async (
  clientId: number,
  targetDate: moment.Moment,
  discountMatrixId?: number,
  ignoreExecutedId?: number,
): Promise<{
  possibles: PossbileCollection;
  exclusionReasons: Record<string, Reason[]>;
  pendings: Discount[];
}> => {
  const contracts = await getClientActiveContracts(clientId, targetDate);
  const possibles: PossbileCollection = [];
  const aggregatedReasons: Record<string, Reason[]> = {};

  for (const contract of contracts) {
    const { possible, exclusionReasons } = await evaluateContractForDiscounts(
      contract,
      contracts,
      targetDate,
      discountMatrixId,
      ignoreExecutedId,
    );

    if (possible) possibles.push(possible);
    mergeExclusionReasons(aggregatedReasons, exclusionReasons);
  }

  const pendings = enrichWithAmbiguityMetadata(
    getPendingfromPossibles(possibles),
  );

  return {
    possibles,
    exclusionReasons: aggregatedReasons,
    pendings,
  };
};

/**
 * Evaluate a single contract for discount eligibility and collect pending results.
 */
const evaluateContractForDiscounts = async (
  contract: AnyModel,
  allContracts: AnyModel[],
  targetDate: moment.Moment,
  discountMatrixId?: number,
  ignoreExecutedId?: number,
): Promise<{
  possible?: {
    pending: Pending[];
    exclusionReasons: Record<string, Reason[]>;
  };
  exclusionReasons: Record<string, Reason[]>;
}> => {
  const { pending, exclusionReasons } = await hasDiscountsPending(
    contract,
    allContracts,
    targetDate,
    discountMatrixId,
    ignoreExecutedId,
  );

  const exclusionMap = { [contract.id]: exclusionReasons };

  return {
    possible: pending.length
      ? {
          pending,
          exclusionReasons: exclusionMap,
        }
      : undefined,
    exclusionReasons: exclusionMap,
  };
};

/**
 * Attach ambiguity flags and generate unique keys for each pending discount.
 */
const enrichWithAmbiguityMetadata = (pendings: Discount[]): Discount[] => {
  const ambiguousKeys = new Set(getAmbiguouses(pendings));

  return pendings.map((discount) => {
    const contractKey = `${discount.base.contractId}:${discount.base.matrixId}`;
    const isAmbiguous = ambiguousKeys.has(contractKey);
    const usedKey = buildUsedKey(discount);

    discount.ambiguous = isAmbiguous;
    discount.key =
      `${contractKey}:${isAmbiguous}` + (usedKey ? `:${usedKey}` : '');

    return discount;
  });
};

/**
 * Create a normalized string key for actor usage.
 * Returns an empty string if `used` is invalid or empty.
 */
const buildUsedKey = (discount: Discount): string => {
  if (!Array.isArray(discount.used)) return '';

  return discount.used
    .map(({ type, typeId }) => `${type}${typeId}`)
    .sort()
    .join(':');
};

/**
 * Merge exclusion reasons into a single map across contracts.
 */
const mergeExclusionReasons = (
  target: Record<string, Reason[]>,
  source: Record<string, Reason[]>,
): void => {
  for (const [contractId, reasons] of Object.entries(source)) {
    target[contractId] = [...(target[contractId] || []), ...reasons];
  }
};
