// @ts-check
'use strict';

const {
  intranet: {
    GfContractHolderChange,
    GfDiscountsExecuted,
    GfDiscountsMatrix,
    GfDiscountsScheduled,
    GfContract,
  },
  AnyModel,
} = require('@models');

const moment = require('moment');
const OneTimeService = require('./OneTimeService');

const { Op } = require('sequelize');
const { twoDatesDaysSwaping } = require('../../utils/dates');
const {
  updateDiscount,
  createDiscount,
} = require('./GfDiscountsScheduledService');
const { DISCOUNT_SCHEDULED } = require('@api/constants/statuses');
const { MOVEMENT_ACTIONS } = require('@api/constants/discount');
const {
  calculateFeePermanenceAmount,
} = require('./Actions/ApplyFeePermanence');

exports.getKeyGroupFromExecuted = async function (executedId) {
  const executed = await GfDiscountsExecuted.findOne({
    where: {
      id: executedId,
      status: [0, 1],
    },
    include: [{ model: GfDiscountsMatrix, as: 'matrix' }],
  });

  return executed && executed.matrix
    ? `${executed.targetContractId}:${executed.matrix.feeGroupLabelId}`
    : null;
};

exports.setApplied = async function (
  discount,
  totalApplied,
  scheduledInvoiceLine,
  control_row_id,
  userId,
) {
  const state = (await exports.isDiscountMultiClient(
    discount,
    scheduledInvoiceLine,
  ))
    ? DISCOUNT_SCHEDULED.PARTIALLY_APPLIED
    : DISCOUNT_SCHEDULED.APPLIED;
  const params = discount.get({ plain: true });
  let nextDiscount = null;

  if (state === DISCOUNT_SCHEDULED.PARTIALLY_APPLIED) {
    params.state = MOVEMENT_ACTIONS.PARTIALLY_APPLIED;
  } else if (state === DISCOUNT_SCHEDULED.APPLIED) {
    params.state = MOVEMENT_ACTIONS.APPLIED;
  } else {
    params.state = MOVEMENT_ACTIONS.UPDATE;
  }

  await updateDiscount(
    discount,
    { state },
    { userId, controlRowId: control_row_id, totalApplied },
  );

  if (discount.permanent) {
    // get contract periodicity
    const contract = await GfContract.findByPk(discount.contractId);
    // generate new replica of scheduled discount
    const replicate = discount.get({ plain: true });
    delete replicate.id;

    const invoiceMonths =
      contract?.invoiceMonths < 1000
        ? contract?.invoiceMonths
        : contract?.invoiceMonths - 1000;
    const nextDate = moment(replicate.date)
      .startOf('month')
      .add(invoiceMonths, 'months');

    replicate.date = nextDate;
    replicate.permanentParentId = discount.id;
    replicate.state = 'pending';
    delete replicate.creationDate;
    delete replicate.updateDate;
    delete replicate.executed;

    nextDiscount = await GfDiscountsScheduled.findOne({
      where: {
        date: replicate.date.format('YYYY-MM-DD HH:mm:ss'),
        matrixId: replicate.matrixId,
        executedId: replicate.executedId,
        permanent: 1,
        permanentParentId: discount.id,
      },
    });

    if (!nextDiscount) {
      const { discount: created } = await createDiscount(
        {
          ...replicate,
          permanent: 1,
          permanentParentId: discount.id,
        },
        { userId },
      );
      nextDiscount = created;
    }
  }

  return {
    success: true,
    scheduled: discount,
    nextScheduled: nextDiscount,
  };
};

exports.isDiscountMultiClient = async function (
  discount,
  scheduledInvoiceLine,
) {
  if (!scheduledInvoiceLine) return false;

  const count = await GfContractHolderChange.count({
    where: {
      contractId: discount.contractId,
      state: 'done',
      changeDate: {
        [Op.between]: [
          scheduledInvoiceLine.initDate.format('YYYY-MM-DD HH:mm:ss'),
          scheduledInvoiceLine.endDate.format('YYYY-MM-DD HH:mm:ss'),
        ],
      },
    },
  });

  return count > 0;
};

exports.applyFeeInitialCharge = async function (contract) {
  const refererTrace = `InitialFees_${contract.id}`;
  const exist = await OneTimeService.exists('global', refererTrace);
  if (exist)
    return {
      success: false,
      reason: 'Allready applied',
    };

  // ignored on php code
  /*$conditions = GfFeesManager::getActualConditions($contract['feeGroupId']);
  if (!($conditions['initialCost'] > 0)){
      return array(
          "success"   => false,
          "reason"    => "Not needed"
      );
  }
  $ado = new GfDiscountsScheduledAdo();
  $id = $ado->insert(array(
      "contractId"    => $contract['id'],
      "matrixId"      => 0,
      "description"   => TextsManager::getText("Initial costs"),
      "date"          => GfDiscountsExecuteManager::getNextInvoiceableDate($contract),
      "discount"      => 0 + $conditions['initialCost'],
      "tpvCode"       => $conditions['initialCostTpvCode'],
      "discountType"  => "fix",
      "type"          => "charge",
      "state"         => "pending",
      "fromScheduleId"=> 0
  ));*/

  await OneTimeService.mark('global', refererTrace);

  return { success: true };
};

/**
 * search discount from past period and current period are applied or now. if applied return success true, else return not ok discount information
 * @param {object | number} contract contract information to check up to date
 * @param {object} period check up to date in which date
 * @param {number} clientId related client information
 */
exports.checkUpToDate = async (contract, period, clientId) => {
  let toReview = false;

  let thisPeriodDiscountScheduled = [];
  const initDate = moment(period.initDate);
  const endDate = moment(period.endDate);
  if (initDate.isValid() && endDate.isValid()) {
    thisPeriodDiscountScheduled = await GfDiscountsScheduled.findAll({
      where: {
        contractId: contract.id,
        date: {
          [Op.between]: [
            initDate.format('YYYY-MM-DD HH:mm:ss'),
            endDate.subtract(1, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
          ],
        },
        state: 'applied',
      },
    });
  }

  if (thisPeriodDiscountScheduled.length) {
    toReview = true;
    if (
      !(await allDiscHaveHolderChange(
        thisPeriodDiscountScheduled,
        contract,
        period,
        clientId,
      ))
    )
      throw new Error(`Discounts from this month are applied`);
  }

  const pastPendingDiscounts = await GfDiscountsScheduled.findAll({
    where: {
      contractId: contract.id,
      date: {
        [Op.lt]: initDate.format('YYYY-MM-01 00:00:00'),
      },
      state: 'pending',
    },
  });

  let index = 0;
  const dateDeactivation = moment(contract.dateDeactivation);
  const filteredPastPendingDiscount = [].concat(pastPendingDiscounts);
  for (const pendingDiscount of pastPendingDiscounts) {
    if (contract.state !== 'suspended') {
      index += 1;
      continue;
    }
    if (pendingDiscount.type === 'charge' && !pendingDiscount.permanent) {
      index += 1;
      continue;
    }
    if (moment(pendingDiscount.date).isAfter(dateDeactivation)) {
      filteredPastPendingDiscount.splice(index, 1);
    }
  }

  if (filteredPastPendingDiscount.length) {
    const str = filteredPastPendingDiscount
      .map(({ id, date }) => {
        return `${id}- [${initDate.format('YYYY-MM-01 00:00:00')}>${moment(
          date,
        ).format('YYYY-MM-DD HH:mm:ss')}]`;
      })
      .join(',');
    throw new Error(
      `Discounts from past months pending to be applied (${str})`,
    );
  }

  return toReview;
};

/**
 * get all discounts and check on each of them to have holder and valid client id on contract or no
 * @param {object[]} discounts discounts should check to all have holder
 * @param {object} contract id of related contract to check information
 * @param {object} period contain initDate and endDate to get information of holder between this period
 * @param {number} clientId id of related client to check information
 * @returns {Promise<boolean>} all dicount have holder or no
 */
const allDiscHaveHolderChange = async function (
  discounts,
  contract,
  period,
  clientId,
) {
  const initDate = moment(period.initDate).format('YYYY-MM-DD HH:mm:ss');
  const endDate = moment(period.endDate)
    .subtract(1, 'minutes')
    .format('YYYY-MM-DD HH:mm:ss');

  const contractIdsOfDiscount = {};
  for (const discount of discounts) {
    contractIdsOfDiscount[discount.contractId] = true;
  }

  const exists = await GfContractHolderChange.count({
    where: {
      contractId: Object.keys(contractIdsOfDiscount),
      state: 'done',
      changeDate: {
        [Op.between]: [initDate, endDate],
      },
    },
  });
  return !(!exists && contract.clientId === clientId);
};

/**
 * generate iLines based on discount value related to a contract
 * @param {Object} discount discount information to get other DiscountLines
 * @param {Object} cons
 * @param {string} type
 * @return {{executed:{id:number,targetContractId:number,active:boolean,init:string,end:string,matrixId:number},
 *  iLines:{code:string,productKey:string,concpet:string,quantity:number}[]}} contain created lines and executed information
 */
exports.generateDiscountLines = (discount, cons, type) => {
  const iLines = [];

  /** find related executed discount */
  const executed = discount.executed ?? {
    id: 0,
    targetContractId: 0,
    active: 0,
  };

  let totalDaysInPeriod = 0;
  for (const monthPeriodId in cons.monthsPeriod) {
    const monthPeriod = cons.monthsPeriod[monthPeriodId];
    const periodInit = moment(monthPeriod.init);
    const periodEnd = moment(monthPeriod.end);
    const discountDate = moment(discount.date);
    totalDaysInPeriod += monthPeriod.daysInMonth;
    /** check discount date is between this period or no */
    if (
      discountDate.isSameOrAfter(periodInit) &&
      discountDate.isSameOrBefore(periodEnd)
    ) {
      break;
    }
  }

  if (executed.active) {
    executed.end = 0;
  }

  /** generate iLines based on type of discount(charge or not) and discountType(fix or percentage) */
  const description = discount.description ? `(${discount.description}) ` : '';
  if (!executed.id && discount.discountType === 'fix') {
    const quantity = parseFloat(discount.discount);
    iLines.push({
      code: discount.tpvCode,
      productKey: 'manualDiscount',
      concpet: description,
      quantity: quantity * (discount.type === 'charge' ? 1 : -1),
    });
  } else {
    if (discount.discountType === 'percentage' && type === 'CELL') {
      const quantity =
        (parseFloat(cons.total) / 100) * parseFloat(discount.discount);

      iLines.push({
        code: discount.tpvCode,
        productKey: 'manualDiscount',
        concpet: description,
        quantity: quantity * (discount.type === 'charge' ? 1 : -1),
      });
    }
    for (const contractBlock of cons?.contractBlocks ?? []) {
      if (!executed.id) {
        if (discount.discountType === 'percentage') {
          const quantity =
            (parseFloat(contractBlock.quote) / 100) *
            parseFloat(discount.discount);
          iLines.push({
            code: discount.tpvCode,
            productKey: 'manualDiscount',
            concpet: description,
            quantity: quantity * (discount.type === 'charge' ? 1 : -1),
          });
          continue;
        }
      }
      const daysInMonthToTakeCare = contractBlock.daysInBlock;
      const daysBetweenStartOfContractAndEndOfExecuted =
        Math.round(
          twoDatesDaysSwaping(
            contractBlock.init,
            contractBlock.end,
            executed.init,
            executed.end ? executed.end : `2500-01-01`,
          ) * 10,
        ) / 10;

      let quantity = 0;
      if (discount.discountType === 'percentage') {
        quantity =
          (contractBlock.quote / 100) *
          (parseFloat(discount.discount) *
            (daysBetweenStartOfContractAndEndOfExecuted /
              daysInMonthToTakeCare));
      } else {
        quantity =
          discount.discount *
          (daysBetweenStartOfContractAndEndOfExecuted / totalDaysInPeriod);
        quantity = Number(
          (Math.floor(Number(quantity) * 1000) / 1000).toFixed(2),
        );
      }

      iLines.push({
        code: discount.tpvCode,
        productKey: discount.matrixId
          ? `matrix:${discount.matrixId}`
          : 'manualDiscount',
        concpet: description,
        quantity: quantity * (discount.type === 'charge' ? 1 : -1),
      });
    }
  }

  return {
    iLines,
    executed,
  };
};

/**
 *
 * @param {AnyModel} contract
 * @param {{initDate: moment.Moment, endDate: moment.Moment}} period
 * @returns {Promise<AnyModel[]>}
 */
exports.getTodayDiscountsToApply = async (contract, period) => {
  const discounts = await GfDiscountsScheduled.findAll({
    where: {
      contractId: contract.id,
      date: {
        [Op.between]: [
          period.initDate.format('YYYY-MM-DD HH:mm:ss'),
          period.endDate.format('YYYY-MM-DD HH:mm:ss'),
        ],
      },
      state: ['pending', 'partialApplied'],
    },
    include: { model: GfDiscountsExecuted, as: 'executed', required: false },
  });

  const filteredDiscount = [].concat(discounts);
  let n = 0;
  for (const discount of discounts) {
    if (contract.state !== 'suspended') {
      n++;
      continue;
    }

    if (discount.type === 'charge' && !discount.permanent) {
      n++;
      continue;
    }

    if (moment(discount.date).isAfter(moment(contract.dateDeactivation))) {
      filteredDiscount.splice(n, 1);
    }
    n++;
  }
  return filteredDiscount;
};

exports.fixInvalidPermanenceDiscount = async () => {
  const invalidDiscounts = await GfDiscountsScheduled.findAll({
    where: {
      tpvCode: 'FI_PERMANENCIA',
      state: DISCOUNT_SCHEDULED.DRAFT,
    },
    include: [
      {
        model: GfContract,
        as: 'contract',
      },
    ],
  });

  for (const invalidDiscount of invalidDiscounts) {
    invalidDiscount.discount = calculateFeePermanenceAmount(
      invalidDiscount.contract,
    );

    await invalidDiscount.save();
  }

  return 'done';
};
