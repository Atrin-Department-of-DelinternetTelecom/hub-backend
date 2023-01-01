import { AnyModel, intranet } from '@models';
import {
  CreationParams,
  cancelDiscounts,
  createDiscount,
  updateDiscount,
} from './GfDiscountsScheduledService';
import { DISCOUNT_TYPE, MOVEMENT_ACTIONS, TYPE } from '@api/constants/discount';
import {
  checkRule,
  searchSubstitutiveActor,
} from './GfDiscountsPendingService';
import { groupBy, sumBy } from 'lodash';

import { DISCOUNT_SCHEDULED } from '@api/constants/statuses';
import GfBonusScheduledService from './GfBonusScheduledService';
import GfDiscountsService from './GfDiscountsService';
import { Op } from 'sequelize';
import assert from 'assert';
import { errors } from '@api/http/http_errors';
import { getFromClient } from './GfContractService';
import { getPeriodPointer } from './Invoice_GfPointerService';
import moment from 'moment';

const {
  GfBonusScheduled,
  GfContract,
  GfContractFeeChange,
  GfDiscountsPending,
  GfDiscountsExecuted,
  GfDiscountsExecutedUsage,
  GfDiscountsHistory,
  GfDiscountsMatrix,
  GfDiscountsMatrixRule,
  GfDiscountsScheduled,
  GfFeegroupsGroupLabelsXref,
  GfFeeGroup,
  MatrixReplacementCombinationRule,
  MatrixReplacementCombinationSet,
  GfBonusContractXref,
  GfBonus,
} = intranet;

export type NextDate = {
  date: string;
  previous: AnyModel | null;
};

const createNewPossiblesBasedOnActiveExecuteds = async (
  activeCombinations: Record<
    string,
    { matrixId: number; reference: string; id: number; contractId: number }[]
  >,
  clientId: number,
) => {
  const possibles: AnyModel[] = [];
  for (const matrixId in activeCombinations) {
    const matrixNodes = activeCombinations[matrixId];
    let hasExecuted = false;
    let lastExecuted = null;
    let stringifiedUsed = '';
    for (const matrixNode of matrixNodes) {
      if (matrixNode.reference === 'executed') {
        lastExecuted = await GfDiscountsExecuted.findByPk(matrixNode.id, {
          include: [{ model: GfDiscountsExecutedUsage, as: 'usages' }],
        });
        assert(lastExecuted, 'executed not found');
        stringifiedUsed = JSON.stringify(
          lastExecuted.usages.map(
            ({ type, typeId, ruleId, matrixId }: AnyModel) => ({
              type,
              typeId,
              ruleId,
              matrixId,
            }),
          ),
        );
        const pending = await GfDiscountsPending.create({
          ambigius: 1,
          matrixId: matrixNode.matrixId,
          contractId: matrixNode.contractId,
          clientId,
          key: matrixNode.id,
          used: stringifiedUsed,
        });
        hasExecuted = true;
        possibles.push(pending);
      }
    }
    if (hasExecuted) {
      const pending = await GfDiscountsPending.create({
        ambigius: 1,
        matrixId: Number(matrixId),
        contractId: lastExecuted?.contractId,
        clientId,
        stringifiedUsed,
      });
      //as main node
      possibles.push(pending);
    }
  }

  return possibles;
};

const makeAvailableMatrixIndexedForClient = (
  possibles: AnyModel[],
  actives: AnyModel[],
) => {
  const possiblesGroupByMatrixId = groupBy(possibles, 'matrixId');
  const activesGroupByMatrixId = groupBy(actives, 'matrixId');
  return mergeObjects(possiblesGroupByMatrixId, activesGroupByMatrixId);
};

function mergeObjects(
  obj1: Record<string, AnyModel[]>,
  obj2: Record<string, AnyModel[]>,
) {
  const merged: Record<
    string,
    { matrixId: number; reference: string; id: number; contractId: number }[]
  > = {};

  // Combine keys from both objects
  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

  // Iterate over the keys
  for (const key of allKeys) {
    const modelsFromObj1 = (obj1[key] || []).map((possible: AnyModel) => ({
      matrixId: possible.matrixId,
      reference: 'possible',
      id: possible.id,
      contractId: possible.contractId,
    }));
    const modelsFromObj2 = (obj2[key] || []).map((possible: AnyModel) => ({
      matrixId: possible.matrixId,
      reference: 'executed',
      id: possible.id,
      contractId: possible.targetContractId,
    }));

    // Merge the arrays for each key (first executed)
    const mergedModels: {
      matrixId: number;
      reference: string;
      id: number;
      contractId: number;
    }[] = [...modelsFromObj2, ...modelsFromObj1];

    // Add the merged array to the merged object
    merged[key] = mergedModels;
  }

  return merged;
}

const makeMatrixIndexedCombinations = async () => {
  const matrixIndexedCombinations: Record<string, number[][]> = {};
  const combinationSets = await MatrixReplacementCombinationSet.findAll({
    include: [
      {
        model: MatrixReplacementCombinationRule,
        as: 'combinationSetRules',
      },
    ],
  });

  for (const combinationSet of combinationSets) {
    if (!matrixIndexedCombinations[combinationSet.matrixId])
      matrixIndexedCombinations[combinationSet.matrixId] = [];

    matrixIndexedCombinations[combinationSet.matrixId].push(
      combinationSet.combinationSetRules.map(
        (rules: AnyModel) => rules.matrixId,
      ),
    );
  }

  return matrixIndexedCombinations;
};

const findActiveCombinations = (
  matrixList: Record<
    string,
    { matrixId: number; reference: string; id: number; contractId: number }[]
  >,
  matrixIndexedCombinations: Record<string, number[][]>,
) => {
  const acceptedCombinations: Record<
    string,
    { matrixId: number; reference: string; id: number; contractId: number }[]
  > = {};
  for (const [matrixId, combinations] of Object.entries(
    matrixIndexedCombinations,
  )) {
    for (const combination of combinations) {
      let acceptMatrix = true;
      const matrixListForCheck = { ...matrixList };
      const acceptedTempCombination: {
        matrixId: number;
        reference: string;
        id: number;
        contractId: number;
      }[] = [];
      for (const combinedMatrixId of combination) {
        if (!matrixListForCheck[combinedMatrixId]?.length) {
          acceptMatrix = false;
          break;
        } else {
          const possible = matrixListForCheck[combinedMatrixId].pop();
          assert(possible, 'possible not found');
          acceptedTempCombination.push({
            matrixId: combinedMatrixId,
            reference: possible.reference,
            id: possible.id,
            contractId: possible.contractId,
          });
        }
      }
      if (acceptMatrix) {
        if (!acceptedCombinations[matrixId])
          acceptedCombinations[matrixId] = [];
        acceptedCombinations[matrixId].push(...acceptedTempCombination);
        matrixList = { ...matrixListForCheck };
      }
    }
  }
  return acceptedCombinations;
};

/**
 * insert new scheduled bono
 *
 * @param  {object} pending
 * @param  {object} matrix
 * @param  {number} executedId
 * @param  {string} keyGroup
 */
export const getBonoDiscountsRows = async (
  contract: AnyModel,
  pending: AnyModel,
  matrix: AnyModel,
  executedId: number,
  keyGroup: string,
  userId?: number,
): Promise<AnyModel> => {
  const first = await getNextPossibleDate(contract, matrix, keyGroup);
  const endDate =
    matrix.numberOfMonths === 0
      ? '2500-01-01'
      : moment(first.date)
          .add(matrix.numberOfMonths, 'months')
          .format('YYYY-MM-DD HH:mm:ss');

  return GfBonusScheduledService.addScheduledBono(
    matrix.bonoId,
    pending.contractId,
    first.date,
    endDate,
    executedId,
    keyGroup,
    userId,
  );
};

interface DiscountRowParams {
  contract: AnyModel;
  pending: AnyModel;
  matrix: AnyModel;
  executedId: number;
  keyGroup: string;
  isFakeDate: boolean;
  userId?: number;
}

export const getScheduledDiscountRows = async ({
  contract,
  pending,
  matrix,
  executedId,
  keyGroup,
  isFakeDate,
  userId,
}: DiscountRowParams): Promise<AnyModel[]> => {
  return matrix.numberOfMonths > 0
    ? getNoPermanentScheduledDiscountRows({
        contract,
        pending,
        matrix,
        executedId,
        keyGroup,
        isFakeDate,
        userId,
      })
    : getPermanentScheduledDiscountRows({
        contract,
        pending,
        matrix,
        executedId,
        keyGroup,
        isFakeDate,
        userId,
      });
};

export const getNoPermanentScheduledDiscountRows = async ({
  contract,
  pending,
  matrix,
  executedId,
  keyGroup,
  isFakeDate,
  userId,
}: DiscountRowParams): Promise<AnyModel[]> => {
  const first = await getNextPossibleDate(contract, matrix, keyGroup);
  const promisses = [];
  const attributes: CreationParams = {
    permanent: 0,
    contractId: pending.contractId,
    matrixId: pending.matrixId,
    executedId: executedId,
    discount: matrix.discount,
    discountType: matrix.discountType,
    type: TYPE.DISCOUNT,
    tpvCode: matrix.idTpv,
    description: matrix.alias,
    keyGroup: keyGroup,
    date: moment(first.date),
    state: DISCOUNT_SCHEDULED.PENDING,
  };

  for (let counter = 0; counter < matrix.numberOfMonths; counter++) {
    const next = moment(first.date).add(counter, 'months');

    promisses.push(
      createDiscount(
        {
          ...attributes,
          date: next,
          state:
            isFakeDate && next.isBefore(moment())
              ? DISCOUNT_SCHEDULED.APPLIED
              : DISCOUNT_SCHEDULED.PENDING,
        },
        { userId },
      ),
    );
  }

  return (await Promise.all(promisses)).map(({ discount }) => discount);
};

export const getPermanentScheduledDiscountRows = async ({
  contract,
  pending,
  matrix,
  executedId,
  keyGroup,
  isFakeDate,
  userId = 0,
}: DiscountRowParams): Promise<AnyModel[]> => {
  const first = await getNextPossibleDate(contract, matrix, keyGroup);
  const discounts = [];
  // permanent scheduled discount

  const { discount } = await createDiscount(
    {
      date: first.date ? moment(first.date) : moment(),
      permanent: 1,
      contractId: pending.contractId,
      matrixId: pending.matrixId,
      executedId: executedId,
      discount: matrix.discount,
      discountType: matrix.discountType,
      type: TYPE.DISCOUNT,
      state: DISCOUNT_SCHEDULED.PENDING,
      tpvCode: matrix.idTpv,
      description: matrix.alias,
      keyGroup,
    },
    { userId },
  );

  if (!isFakeDate) {
    discounts.push(discount);
    return discounts;
  }

  // if is a fake date
  // create all discounts since todayIs to date("Y-m-d") applieds
  let next: AnyModel = discount;
  let counter = 0;
  while (moment(next.date).isBefore(moment()) && counter++ < 50) {
    // PS: max 50
    const { scheduled, nextScheduled } = await GfDiscountsService.setApplied(
      next,
    );
    discounts.push(scheduled);
    //@ts-ignore
    next = nextScheduled;
  }

  const nextDiscount = await GfDiscountsScheduled.findByPk(next.id);

  // set last scheduled entered as pending
  await updateDiscount(
    nextDiscount as AnyModel,
    { state: DISCOUNT_SCHEDULED.PENDING },
    { userId },
  );

  return discounts;
};

export const getNextPossibleDate = async (
  contract: AnyModel,
  matrix: AnyModel,
  keyGroup: string,
  ignoreKeyGroup?: string,
  ignoreDiscounts: AnyModel[] = [],
): Promise<NextDate> => {
  return matrix.discountType === 'bono'
    ? getNextPossibleDateForBono(keyGroup)
    : getNextPossibleDateForDiscount(
        contract,
        matrix,
        ignoreKeyGroup,
        ignoreDiscounts,
      );
};

export const getNextPossibleDateForBono = async (
  keyGroup: string,
): Promise<NextDate> => {
  const scheduledBono = await GfBonusScheduled.findOne({
    where: { keyGroup },
    order: [['endDate', 'DESC']],
  });

  return {
    previous: scheduledBono,
    date: scheduledBono?.endDate || moment().format('YYYY-MM-DD'),
  };
};

export const getNextPossibleDateForDiscount = async (
  contract: AnyModel,
  matrix: AnyModel,
  ignoreKeyGroup?: string,
  ignoreDiscounts: AnyModel[] = [],
): Promise<NextDate> => {
  // get first  possible date to make the discount
  // base on last scheduled date from the same keyGroup
  const discount = await GfDiscountsScheduled.findOne({
    where: {
      contractId: contract.id,
      type: 'discount',
      state: {
        [Op.not]: ['draft', 'canceled'],
      },
      keyGroup: {
        [Op.not]: ignoreKeyGroup,
      },
      permanent: 0,
      id: {
        [Op.notIn]: ignoreDiscounts.map((discount) => discount.id),
      },
    },
    order: [['date', 'DESC']],
  });

  let first = moment();

  if (discount !== null && matrix.numberOfMonths > 0) {
    first = moment(discount.date || first).add(1, 'months');
  } else {
    // first discount to next invoice
    const date = contract.invoiceMonths
      ? (await getPeriodPointer(contract, true)).period.initDate
      : first;

    first = moment(date); // next periodva
  }

  // ensure date is after or equal to first day of current month
  first = first.isBefore(moment().startOf('month'))
    ? moment().startOf('month')
    : first;

  // if contract intiDate is in this month and is not permanent, wait for +1 month to apply the discount
  if (
    first.isSame(moment(contract.dateActivation)) &&
    matrix.numberOfMonths > 0 &&
    discount === null &&
    matrix.proportionalNonPermanent !== 1
  ) {
    first = moment().add(1, 'months');
  }

  return {
    date: first.format('YYYY-MM-DD HH:mm:ss'),
    previous: discount,
  };
};

export const onContractDown = async (
  contractId: number,
  todayIs?: string,
  userId?: number,
) => {
  /*
   * delete his discounts
   */
  const myDiscountsExecutedAsTarget = await GfDiscountsExecuted.scope([
    'active',
    'defaultScope',
  ]).findAll({
    where: {
      targetContractId: contractId,
    },
    include: [
      {
        model: GfDiscountsMatrix,
        as: 'matrix',
        include: [
          {
            model: MatrixReplacementCombinationSet,
            as: 'combinationSets',
            required: false,
            include: [
              {
                model: MatrixReplacementCombinationRule,
                as: 'combinationSetRules',
                required: false,
              },
            ],
          },
        ],
      },
    ],
  });

  const bonoXrefs = await GfBonusContractXref.findAll({
    where: { contractId },
  });

  const myDiscountsAsActor = await GfDiscountsExecutedUsage.findAll({
    where: {
      [Op.or]: [
        { typeId: contractId, type: 'contract' },
        {
          typeId: bonoXrefs.map((bonoXref) => bonoXref.id),
          type: 'contract-bono',
        },
      ],
      '$executed.active$': 1,
    },
    include: [
      {
        model: GfDiscountsExecuted,
        as: 'executed',
        include: [
          {
            model: GfDiscountsMatrix,
            as: 'matrix',
            include: [
              {
                model: MatrixReplacementCombinationSet,
                as: 'combinationSets',
                required: false,
                include: [
                  {
                    model: MatrixReplacementCombinationRule,
                    as: 'combinationSetRules',
                    required: false,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });
  const myDiscountsExecutedAsActor: AnyModel[] = [];
  const futureUsagesReleased: AnyModel[] = [];
  let rets = [];

  const addedDiscount: Record<string, boolean> = {};
  for (const usage of myDiscountsAsActor) {
    const discount = usage.executed;

    if (discount && !addedDiscount[discount.id]) {
      addedDiscount[discount.id] = true;
      myDiscountsExecutedAsActor.push(discount);
    }
  }

  for (const item of myDiscountsExecutedAsTarget) {
    const result = await cancelDiscount(item, true, todayIs, userId);
    if (item.matrix.combinationSetRules?.length)
      await releaseUsageCombinations(item);
    rets.push(result);
  }

  const futureUsagesReleasedUnique: Record<string, boolean> = {};
  for (const item of myDiscountsExecutedAsActor) {
    await GfDiscountsExecutedUsage.findAll({
      where: {
        executedId: item.id,
      },
    }).then((items) => {
      for (const item of items)
        if (!futureUsagesReleasedUnique[item.id]) {
          futureUsagesReleasedUnique[item.id] = true;
          futureUsagesReleased.push(item);
        }
    });
  }

  for (const item of myDiscountsExecutedAsActor) {
    // search for a substitute
    const _futureUsagesReleased: AnyModel[] = [];

    for (const usage of futureUsagesReleased)
      if (usage.executedId === item.id) _futureUsagesReleased.push(usage);

    const result = await searchSubstitutiveActor(
      item,
      contractId,
      _futureUsagesReleased,
    );

    if (result.success) {
      await replaceDiscountActor(item, result.replacements);
    } else {
      rets = rets.concat(await cancelDiscount(item, true, todayIs, userId));
      await releaseUsageCombinations(item);
    }
  }

  return rets;
};

export const releaseUsageCombinations = async (discountExecuted: AnyModel) => {
  const combinationMatrixIds: number[] = (
    discountExecuted.matrix.combinationSets ?? []
  ).reduce((acc: number[], combinationSet: AnyModel) => {
    (combinationSet.combinationSetRules ?? []).forEach(
      (combinationRule: AnyModel) => {
        acc.push(combinationRule.matrixId);
      },
    );
    return acc;
  }, [] as number[]);

  const hideExecutedGroupByMatrixId = groupBy(
    await GfDiscountsExecuted.findAll({
      where: {
        targetContractId: discountExecuted.targetContractId,
        matrixId: { [Op.in]: combinationMatrixIds },
        status: 0,
        combinationExecutedTask: 1,
      },
    }),
    'matrixId',
  );

  const removeExecutedIds: number[] = [];
  combinationMatrixIds.forEach((combinationMatrixId) => {
    removeExecutedIds.push(
      hideExecutedGroupByMatrixId[combinationMatrixId]?.pop()?.id ?? 0,
    );
  });
  await GfDiscountsExecuted.scope(['all']).update(
    { combinationExecutedTask: 0 },
    { where: { id: { [Op.in]: removeExecutedIds } } },
  );

  await GfDiscountsExecutedUsage.update(
    { status: 0 },
    { where: { executedId: { [Op.in]: removeExecutedIds } } },
  );
};

/**
 *
 * @param {AnyModel} executedDiscount
 * @param {*} removeUsagesToo
 * @param {*} _now
 * @param {number} userId
 * @returns
 */
export const cancelDiscount = async (
  executedDiscount: AnyModel,
  removeUsagesToo = true,
  _now?: string,
  userId?: number,
): Promise<{
  success: boolean;
  executed: AnyModel;
  scheduled: {
    refund: { success: boolean; reason?: string; schedules?: AnyModel } | null;
    removed: { success: boolean; deletedScheduleds: AnyModel[] };
    removedBonos: AnyModel[];
  };
}> => {
  const now = _now ? moment(_now) : moment();
  // TODO
  // start transaction on GfDiscountsExecutedUsage

  if (removeUsagesToo) {
    await GfDiscountsExecutedUsage.update(
      { status: 0 },
      { where: { executedId: executedDiscount.id } },
    );
  }

  // down executed
  await executedDiscount.update({
    end: now.format('YYYY-MM-DD HH:mm:ss'),
    active: 0,
  });

  // check if we need to do a undo
  // calculate months has been actived
  const initDate = moment(
    executedDiscount.initDate
      ? executedDiscount.initDate
      : executedDiscount.creationDate,
  );
  const endDate = now.clone();
  const stay = endDate.diff(initDate, 'months');
  const matrix = await GfDiscountsMatrix.findByPk(executedDiscount.matrixId);
  const removed = await removePendingScheduled(executedDiscount, _now, userId);
  const removedBonos = await removePromotionalBonos(executedDiscount, _now);
  const keyGroup = String(
    await GfDiscountsService.getKeyGroupFromExecuted(executedDiscount.id),
  );

  // check refund
  await setCompensatives(keyGroup, executedDiscount, userId);
  const refund =
    matrix?.stay > stay
      ? await refundDiscount(executedDiscount, _now, userId)
      : null;

  // reset dates from all keygroup
  await resetDates(keyGroup, userId);

  // if there are not any other discount moved to this month, reactivate currently removed
  if (removed.deletedScheduleds.length === 1) {
    // case permanent must be only one discount
    // reactivate and make it no permanent
    const discountsScheduled = await GfDiscountsScheduled.findOne({
      where: {
        contractId: removed.deletedScheduleds[0].contractId,
        keyGroup: removed.deletedScheduleds[0].keyGroup,
        date: removed.deletedScheduleds[0].date,
        state: 'pending',
      },
    });

    if (discountsScheduled === null) {
      await updateDiscount(
        removed.deletedScheduleds[0],
        { state: DISCOUNT_SCHEDULED.PENDING, permanent: 0 },
        { userId },
      );
    }
  }

  // activate / deactivate all bonus if any
  await GfBonusScheduledService.searchAndApplyIndate(
    executedDiscount.targetContractId,
    userId,
  );
  await GfBonusScheduledService.searchAndApplyOutdate(
    executedDiscount.targetContractId,
    //@ts-ignore
    userId,
  );

  // TODO
  // end transction

  return {
    success: true,
    executed: executedDiscount,
    scheduled: {
      refund: refund,
      removed: removed,
      removedBonos: removedBonos,
    },
  };
};

/**
 * Remove future and permanent scheduled discounts
 */
export const removePendingScheduled = async (
  executedDiscount: AnyModel,
  todayIs?: string,
  userId?: number,
): Promise<{ success: boolean; deletedScheduleds: AnyModel[] }> => {
  let futures = await GfDiscountsScheduled.findAll({
    where: {
      executedId: executedDiscount.id,
      state: DISCOUNT_SCHEDULED.PENDING,
    },
  });

  // if todayIs, add future scheduled applied too
  if (todayIs) {
    const discounts = await GfDiscountsScheduled.findAll({
      where: {
        executedId: executedDiscount.id,
        state: DISCOUNT_SCHEDULED.APPLIED,
        date: {
          [Op.gte]: todayIs,
        },
      },
    });

    futures = futures.concat(discounts);
  }

  await cancelDiscounts(futures, { userId });

  const updatedFutures = await GfDiscountsScheduled.findAll({
    where: { id: futures.map((future) => future.id) },
  });

  return {
    success: true,
    deletedScheduleds: updatedFutures,
  };
};

export const removePromotionalBonos = async (
  executedDiscount: AnyModel,
  todayIs?: string,
): Promise<AnyModel[]> => {
  const wheres = {
    where: {
      executedId: executedDiscount.id,
    },
  };

  const bonuses = await GfBonusScheduled.findAll(wheres);
  await GfBonusScheduled.update({ status: 0 }, wheres);

  return bonuses;
};

export const getDiscountsForRefund = async (
  executedDiscount: AnyModel,
  todayIs: string | moment.Moment = moment(),
) => {
  return groupBy(
    await GfDiscountsScheduled.findAll({
      where: {
        executedId: executedDiscount.id,
        type: TYPE.DISCOUNT,
        state: [
          DISCOUNT_SCHEDULED.APPLIED,
          DISCOUNT_SCHEDULED.PARTIALLY_APPLIED,
        ],
      },
    }),
    (discount) => {
      if (moment(discount.date).isAfter(moment(todayIs))) {
        return 'upcoming';
      }

      return discount.compensatedById ? 'compensated' : 'schedules';
    },
  ) as {
    compensated: AnyModel[];
    schedules: AnyModel[];
    upcoming: AnyModel[];
  };
};

/**
 * Refund applied discounts.
 *
 * @param  {any} executedDiscount [description]
 * @param  {any} todayIs          [description]
 */
export const refundDiscount = async (
  executedDiscount: AnyModel,
  todayIs: string | moment.Moment = moment(),
  userId?: number,
): Promise<{
  success: boolean;
  reason?: string;
  scheduleds?: AnyModel | null;
}> => {
  const { upcoming, schedules } = await getDiscountsForRefund(
    executedDiscount,
    todayIs,
  );

  // all schedules applied in the future must be deleted instead refunded
  // because it's a fake scheduled
  await cancelDiscounts(upcoming ?? [], { userId });

  const histories = await GfDiscountsHistory.findAll({
    where: {
      scheduledId: (schedules ?? []).map((discount) => discount.id),
      action: [MOVEMENT_ACTIONS.APPLIED, MOVEMENT_ACTIONS.PARTIALLY_APPLIED],
    },
  });

  const total = sumBy(histories, (historiy) =>
    historiy.amount ? Number(historiy.amount) : 0,
  );

  if (total <= 0) {
    return {
      success: false,
      reason: 'total to refund = 0',
    };
  }

  // initial date pont to insert next charge if any and interval
  const contract = await GfContract.findByPk(executedDiscount.targetContractId);
  //@ts-ignore
  const nextPeriod = (await getPeriodPointer(contract, true)).period;
  const matrixId = schedules.pop()?.matrixId;
  const { discount } = await createDiscount(
    {
      contractId: contract?.id,
      matrixId: matrixId,
      date: moment(nextPeriod.initDate), // nextInvoice
      discount: total * -1,
      discountType: DISCOUNT_TYPE.FIX,
      type: TYPE.CHARGE,
      state: DISCOUNT_SCHEDULED.PENDING,
      tpvCode: 'STAYBROKE',
    },
    { userId },
  );

  return {
    success: true,
    scheduleds: discount,
  };
};

export const deleteDiscount = async (executed: AnyModel): Promise<void> => {
  // nothing found on php code but called (:)
};

/**
 *
 * MATRIX DISCOUNTS RELATED
 *
 * @param {any} keyGroup
 *
 * move all discounts for the same keyGroup
 * to start next invoice and consequent
 */
export const resetDates = async (
  keyGroup: string,
  userId = 0,
): Promise<void> => {
  const parts = keyGroup.split(':');
  const permanents = await GfDiscountsScheduled.findAll({
    where: {
      permanent: 1,
      keyGroup: keyGroup,
      state: 'pending',
    },
  });

  const nonPermanents = await GfDiscountsScheduled.findAll({
    where: {
      permanent: 0,
      keyGroup: keyGroup,
      state: 'pending',
    },
  });

  const contract = await GfContract.findByPk(parts[0]);
  const matrix = await GfDiscountsMatrix.findByPk(parts[1]);
  if (matrix === null) return;
  const next = await getNextPossibleDate(
    //@ts-ignore
    //TODO
    contract,
    matrix,
    null,
    null,
    permanents.concat(nonPermanents),
  );
  let firstDate = moment(next.date);

  // first, place the non permanent discounts
  for (const nonPermanent of nonPermanents) {
    await updateDiscount(nonPermanent, { date: firstDate }, { userId });

    firstDate = firstDate.add(1, 'months');
  }

  // now, place all permanents at end
  await Promise.all(
    permanents.map((permanent) => {
      return updateDiscount(permanent, { date: firstDate }, { userId });
    }),
  );
};

/*
 * gets applied scheduled discounts from a non active discounts and searches
 * from other executed discounts from the same keyGroup and mark as canceled
 */
export const setCompensatives = async (
  keyGroup: string,
  executedDiscount: AnyModel,
  userId = 0,
): Promise<{ success: boolean }> => {
  const lines = await GfDiscountsScheduled.findAll({
    where: {
      keyGroup: keyGroup,
    },
    include: [
      {
        model: GfDiscountsExecuted,
        as: 'executed',
        required: true,
        where: {
          id: executedDiscount.id,
        },
      },
    ],
  });

  if (lines.length === 0) {
    // it's a bono discount?
    return setCompensativeForBonos(keyGroup, executedDiscount);
  }

  const mustBeCompensateds = lines.filter((discount) => {
    const hasComp = lines.find((line) => {
      // must be compensated
      return line.id === discount.compensatedById && line.active !== 1;
    });

    return (
      !discount.executed.isActive() &&
      (discount.isApplied() || discount.isPartialApplied()) &&
      (!discount.compensatedById || hasComp)
    );
  });

  const compared: number[] = [];

  for (const mustBeCompensated of mustBeCompensateds) {
    // search for identical pending to be cancelled
    const identical = lines.find((discount) => {
      return (
        !compared.includes(discount.id) &&
        discount.executed.isActive() &&
        discount.permanent === mustBeCompensated.permanent &&
        discount.discount === mustBeCompensated.discount &&
        discount.discountType === mustBeCompensated.discountType &&
        discount.type === mustBeCompensated.type
      );
    });

    if (identical) {
      // cancel and mark as compensed
      compared.push(identical.id);

      await Promise.all([
        updateDiscount(
          identical,
          { state: DISCOUNT_SCHEDULED.CANCELED },
          { userId },
        ),
        updateDiscount(
          mustBeCompensated,
          { compensatedById: identical.id },
          { userId },
        ),
      ]);
    }
  }

  return {
    success: true,
  };
};

export const setCompensativeForBonos = async (
  keyGroup: string,
  executedDiscount: AnyModel,
): Promise<{ success: boolean }> => {
  const bonuses = await GfBonusScheduled.findAll({
    where: {
      keyGroup: keyGroup,
      initDate: {
        [Op.gt]: executedDiscount.initDate,
      },
    },
    order: [['initDate', 'ASC']],
  });

  let moveTo = executedDiscount.init;

  for (const bonus of bonuses) {
    const days = moment(bonus.initDate).diff(moment(bonus.endDate), 'days');
    await bonus.update({
      initDate: moveTo,
      endDate: moment(bonus.initDate)
        .add(days - 1, 'days')
        .format('YYYY-MM-DD HH:mm:ss'),
    });

    await GfDiscountsExecuted.update(
      {
        init: bonus.initDate,
        end: bonus.endDate,
      },
      {
        where: {
          id: bonus.executedId,
        },
      },
    );

    moveTo = bonus.endDate;
  }

  return {
    success: true,
  };
};

export const replaceDiscountActor = async (
  executedRow: AnyModel,
  replacements: { toTypeId: number; fromTypeId: number; type: string }[],
): Promise<void> => {
  for (const { toTypeId, fromTypeId, type } of replacements) {
    const usage = await GfDiscountsExecutedUsage.findOne({
      where: {
        type,
        typeId: fromTypeId,
        executedId: executedRow.id,
      },
    });

    await usage?.update({ typeId: toTypeId });
  }
};

export const getDiscountsFromContract = async (
  contractId: number,
): Promise<{ pending: AnyModel[]; executed: AnyModel[] }> => {
  const pendingDiscounts = await GfDiscountsPending.findAll({
    where: {
      contractId: contractId,
    },
  });

  const executedDiscounts = await GfDiscountsExecuted.findAll({
    where: {
      targetContractId: contractId,
    },
  });

  return {
    pending: pendingDiscounts,
    executed: executedDiscounts,
  };
};

export const onHolderChanged = async (
  changeHolder: AnyModel,
  todayIs?: string,
  userId?: number,
) => {
  const executedDiscounts = await GfDiscountsExecuted.findAll({
    where: { active: 1 },
    include: [
      {
        model: GfDiscountsMatrix,
        as: 'matrix',
        required: false,
      },
      {
        model: GfDiscountsExecutedUsage,
        as: 'usages',
        required: true,
        where: { type: 'contract', typeId: changeHolder.contractId },
      },
    ],
  });

  for (const executed of executedDiscounts) {
    await cancelDiscount(executed, true, todayIs, userId);
    await releaseUsageCombinations(executed);
  }
};

/**
 *
 * @param {number} changeFeeRowId
 * @param {moment.Moment} todayIs
 * @param {number} userId
 * @returns
 */
export const onFeeChanged = async (
  changeFeeRowId: number,
  todayIs?: string,
  userId?: number,
): Promise<{ success: boolean }> => {
  const changeRow = await GfContractFeeChange.findByPk(changeFeeRowId);

  if (changeRow === null) return { success: true };

  // TODO:
  // check if this contract has any discount
  const executeds = await GfDiscountsExecuted.findAll({
    where: {
      targetContractId: changeRow.contractId,
      active: 1,
    },
    include: [
      {
        model: GfDiscountsMatrix,
        as: 'matrix',
        required: false,
      },
    ],
  });

  for (const executed of executeds) {
    const labelXref = await GfFeegroupsGroupLabelsXref.findOne({
      where: {
        feeGroupId: executed?.matrix?.toFeeGroupId ?? 0,
        labelId: executed?.matrix?.feeGroupLabelId ?? 0,
      },
      include: [
        {
          model: GfDiscountsMatrix,
          as: 'matrix',
          include: [
            {
              model: MatrixReplacementCombinationSet,
              as: 'combinationSets',
              required: false,
              include: [
                {
                  model: MatrixReplacementCombinationRule,
                  as: 'combinationSetRules',
                  required: false,
                },
              ],
            },
          ],
        },
      ],
    });

    if (!labelXref) {
      await cancelDiscount(executed, true, todayIs, userId);
      await releaseUsageCombinations(executed);
    }
  }

  // check if this contract is an actor from another discount
  const contract = await GfContract.findByPk(changeRow.contractId);
  if (contract === null) return { success: true };
  const contracts = await getFromClient(contract.clientId);
  const contractsById = [];

  for (const contract of contracts) {
    contractsById[contract.id] = contract;
  }

  const usages = await GfDiscountsExecutedUsage.findAll({
    where: {
      type: 'contract',
      typeId: changeRow.contractId,
    },
    include: [
      {
        model: GfDiscountsMatrixRule,
        as: 'rule',
        required: false,
      },
      {
        model: GfDiscountsExecuted,
        as: 'executed',
        required: false,
        where: {
          active: 1,
        },
        include: [
          {
            model: GfDiscountsMatrix,
            as: 'matrix',
            include: [
              {
                model: MatrixReplacementCombinationSet,
                as: 'combinationSets',
                required: false,
                include: [
                  {
                    model: MatrixReplacementCombinationRule,
                    as: 'combinationSetRules',
                    required: false,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  for (const usage of usages) {
    const checkRuleContracts = [];

    if (!usage.executed) continue;

    checkRuleContracts.push(contractsById[usage.typeId]);
    checkRuleContracts.push(contractsById[usage.executed.targetContractId]);

    const possibles = await checkRule(
      usage.rule,
      checkRuleContracts,
      undefined,
      true,
      moment(),
    );

    // cannot be used, delete discount
    if (possibles.length <= 0) {
      await cancelDiscount(usage.executed, true, todayIs, userId);
      await releaseUsageCombinations(usage.executed);
    }
  }

  return { success: true };
};

export const getDiscountInfo = async (
  executedId: number,
): Promise<{
  executed: AnyModel;
  matrix: AnyModel;
  used: object[];
}> => {
  const executed = (
    await GfDiscountsExecuted.findByPk(executedId, {
      include: [
        {
          model: GfDiscountsExecutedUsage,
          as: 'usages',
          required: false,
          include: [
            {
              model: GfDiscountsExecuted,
              as: 'executed',
              include: [
                {
                  model: GfContract,
                  as: 'contract',
                  include: [{ model: GfFeeGroup, as: 'fee_group' }],
                },
                { model: GfDiscountsMatrix, as: 'matrix' },
              ],
              where: { status: [0, 1] },
            },
            {
              model: GfContract,
              as: 'contract',
              include: [{ model: GfFeeGroup, as: 'fee_group' }],
              required: false,
            },
            {
              model: GfBonusContractXref,
              as: 'bono_xref',
              required: false,
              include: [
                {
                  model: GfBonus,
                  as: 'bonus',
                },
              ],
            },
          ],
        },
      ],
    })
  )?.get({ plain: true });

  if (!executed)
    throw new errors.NotFound(`executed with id ${executedId} not found`);

  const matrix = await GfDiscountsMatrix.findOne({
    where: { id: executed.matrixId, status: [0, 1] },
  });
  if (!matrix)
    throw new errors.NotFound(`matrix with id ${executed.matrixId} not found`);

  const used = [];
  for (const usage of executed.usages) {
    if (usage.type === 'contract') {
      used.push({ type: 'contract', data: usage.contract });
    } else if (usage.type === 'matrix') {
      const executed = await GfDiscountsExecuted.findByPk(executedId, {
        include: [
          {
            model: GfContract,
            as: 'contract',
            include: [{ model: GfFeeGroup, as: 'fee_group' }],
          },
          { model: GfDiscountsMatrix, as: 'matrix' },
        ],
      });
      used.push({ type: 'matrix', data: executed });
    } else if (usage.type === 'contract-bono') {
      used.push({ type: 'contract-bono', data: usage.bono_xref?.bonus });
    }
  }
  delete executed.usages;
  return {
    executed,
    matrix,
    used,
  };
};
