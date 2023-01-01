// @ts-check
'use strict';
import { AnyModel, intranet } from '@models';

const {
  GfKamailioUnifiedCdr,
  GfDiscountsScheduled,
  GfBonus,
  InvoiceTaxType,
  InvoiceClientsInvoiceProfile,
  GfAireCdr2,
  GfContract,
} = intranet;

import assert from 'assert';

import * as FacadeCell from './FacadeCell';

import {
  consolideTotalsForAutomaticInvoice,
  setInvoiceLinesForAutomaticInvoice,
} from './InvoiceInvoiceService';

import * as ConfigService from './ConfigService';

import * as Invoice_GfPointerService from '@service/intranet/Invoice_GfPointerService';

import {
  daysBetweenTwoDates,
  findMinMaxBetweenThreeDates,
  twoDatesDaysSwaping,
  getMonths,
  threeDatesDaysSwaping,
} from '../../utils/dates';

import * as Payment from './PaymentService';

import {
  checkUpToDate,
  getTodayDiscountsToApply,
  generateDiscountLines,
  setApplied,
  isDiscountMultiClient,
} from './GfDiscountsService';

import { Op, fn, col } from 'sequelize';

import * as GfFeeService from './Fee/GfFeeService';
import * as GfContractSectionStatusService from './GfContractSectionStatusService';
import * as GfContractService from './GfContractService';

import moment, { Moment } from 'moment';

import _ from 'lodash';

import * as InvoiceLimboLineService from './InvoiceLimboLineService';
import * as InvoiceProductService from './InvoiceProductService';
import {
  generateCreateDiscountData,
  generateUpdatedDiscountData,
} from './GfDiscountsScheduledService';
import { CELL_PROVIDER_CODE, SERVICE } from '@api/constants/contracts';
import { DISCOUNT_SCHEDULED } from '@api/constants/statuses';
import { MOVEMENT_ACTIONS } from '@api/constants/discount';

const dateFormat = 'YYYY-MM-DD HH:mm:ss';

type InvoiceLine = {
  contractId: number;
  scheduledId: number;
  concpet: string;
  parameters: string;
  quantity: string;
  date: string;
  code: string;
  productKey: string;
  days?: number;
  sectionCode: string;
};

type PeriodType = { initDate: Moment; endDate: Moment; emitionDate: Moment };

type DataOfContract = {
  contractId: number;
  clientId: number;
  period: PeriodType;
  invoiceLinesIds: number[];
  discountsExecuted: {
    matrixId: number;
    init: string;
    end: string;
    executedId: number;
    active: boolean;
  }[];
  extraProcess: string[];
};
interface AbstractDataOfContract
  extends DataOfContract,
    Awaited<ReturnType<typeof GfContractService.getContractHistory>> {}
type Month = { init: string; end: string; daysInMonth: number };

const AllBono: Record<string, AnyModel> = {};
export const initAllBono = async (force = false) => {
  if (!Object.keys(AllBono).length || force) {
    (await GfBonus.findAll()).forEach((bono) => {
      AllBono[bono.id] = bono;
    });
  }
};

export const generateIlines = async (
  period: PeriodType,
  contract: AnyModel,
  client: AnyModel,
  control_row_id: number,
  userId: number,
  comeFromControlRows = false,
) => {
  const realPeriod = {
    initDate: period.initDate.clone(),
    endDate: period.endDate.clone(),
  };
  if (contract.state !== 'suspended' && contract.dateDeactivation) {
    contract.dateDeactivation = null;
    await contract.save();
  }

  const consumption = await getTotalPeriod(
    contract,
    client,
    period,
    control_row_id,
    comeFromControlRows,
  );

  let abstract: AbstractDataOfContract = {
    contractId: contract.id,
    clientId: client.id,
    period,
    invoiceLinesIds: [],
    fees: {},
    bonos: {},
    holders: {},
    blocked: [],
    discountsExecuted: [],
    extraProcess: [],
  };

  const discountChanges: {
    histories: Awaited<
      ReturnType<typeof setAppliedInvoiceProcess>
    >['histories'];
    newScheduled: Awaited<
      ReturnType<typeof setAppliedInvoiceProcess>
    >['nextScheduled'][];
    updateScheduled: Awaited<
      ReturnType<typeof setAppliedInvoiceProcess>
    >['scheduled'][];
  } = {
    histories: [],
    newScheduled: [],
    updateScheduled: [],
  };

  abstract = {
    contractId: contract.id,
    clientId: client.id,
    period,
    invoiceLinesIds: [],
    fees: {},
    bonos: {},
    holders: {},
    blocked: [],
    discountsExecuted: [],
    extraProcess: [],
  };
  const type = Object.keys(consumption)[0] as SERVICE;
  if (type !== 'CELL') {
    abstract = {
      contractId: contract.id,
      clientId: client.id,
      period,
      invoiceLinesIds: [],
      fees: consumption[type]?.contractHistory?.fees ?? [],
      bonos: consumption[type]?.contractHistory?.bonos ?? [],
      holders: consumption[type]?.contractHistory?.holders ?? [],
      blocked: consumption[type]?.contractHistory?.blocked ?? [],
      discountsExecuted: [],
      extraProcess: [],
    };
  }

  const ret: Record<string, any> = {};

  ret.period = period;
  const scheduledId = 9999;

  const toReview = await checkUpToDate(contract, realPeriod, client.id);

  const discounts = await getTodayDiscountsToApply(contract, realPeriod);
  ret.discounts = discounts;
  ret.consumption = consumption;

  let sections = null;
  if (comeFromControlRows)
    sections = await GfContractSectionStatusService.getAllForContract(
      contract.id,
    );
  else
    sections = (await GfContractSectionStatusService.getAllCached())[
      contract.id
    ];
  let cellInvoiceLine = null;
  const iLines: InvoiceLine[] = [];
  let specificReference = null;
  let parameters = '';

  for (const type in ret.consumption) {
    const cons = ret.consumption[type];

    switch (type) {
      case SERVICE.CELL:
        specificReference = sections?.CELL?.row?.number ?? '';
        parameters = JSON.stringify({
          telf: specificReference,
        });
        if (cons.invoiceLineRow && typeof cons.invoiceLineRow !== 'string')
          cellInvoiceLine = cons.invoiceLineRow;
        break;
      case SERVICE.INTERNET:
        specificReference = sections?.INTERNET?.row?.ip ?? '';
        parameters = JSON.stringify({
          ip: specificReference,
          address: generateAddressForInvoiceLine(sections?.INTERNET?.row),
        });
        break;
      case SERVICE.FIX:
        specificReference = sections?.FIX?.row?.number ?? '';
        parameters = JSON.stringify({
          telf: specificReference,
        });
        break;
      case SERVICE.TV:
        specificReference = 'GoTV';
        parameters = JSON.stringify({});
        break;
      case SERVICE.SUBSCRIPTION:
        specificReference = 'SUBSCRIPTION';
        parameters = JSON.stringify({});
        break;
      default:
        break;
    }

    for (const code in cons?.feeAbstract) {
      const fa = cons.feeAbstract[code];
      if (isLemonFeeWithBono(cons.feeAbstract[code])) {
        fa.total += 0.83;
      }
      iLines.push({
        code: fa.tpvId,
        date: period.emitionDate.format('YYYY-MM-DD HH:mm:ss'),
        productKey: fa.productKey,
        contractId: contract.id,
        concpet: `${
          fa.days > 0 ? `${parseFloat(fa.days).toFixed(2).toString()} dies` : ''
        } quota base '${fa.description}' (${specificReference})`,
        quantity: parseFloat(fa.total).toFixed(2),
        days: fa.days,
        parameters,
        scheduledId,
        sectionCode: contract.section.sectionName,
      });
    }

    for (const code in cons?.bonosAbstract) {
      const _fa = cons.bonosAbstract[code];
      for (const fa of _fa) {
        let concept = '';
        if (fa.days !== '-') {
          concept = `${
            fa.days > 0
              ? `${parseFloat(fa.days).toFixed(2).toString()} dies`
              : ''
          } bono '(${
            type === 'CELL' ? code : fa.description
          })' (${specificReference})`;
        } else {
          concept = `bono ${code} (${specificReference})`;
        }
        iLines.push({
          code: fa.tpvId,
          date: period.emitionDate.format('YYYY-MM-DD HH:mm:ss'),
          productKey: fa.productKey,
          contractId: contract.id,
          concpet: concept,
          quantity: parseFloat(fa.total).toFixed(2),
          days: fa.days,
          parameters,
          scheduledId,
          sectionCode: contract.section.sectionName,
        });
      }
    }

    for (const consumption of cons?.consumptionAbstract ?? []) {
      iLines.push({
        code: consumption.tpvId,
        date: period.emitionDate.format('YYYY-MM-DD HH:mm:ss'),
        contractId: contract.id,
        concpet: `consum  (${specificReference})`,
        quantity: consumption.total,
        parameters,
        productKey: consumption.productKey,
        scheduledId,
        sectionCode: contract.section.sectionName,
      });
    }

    const percentage = parseFloat(contract.percentageDiscount);
    let hasContractDiscount = false;
    for (const code in cons?.feeAbstract) {
      const fa = cons.feeAbstract[code];
      const ds2 = (fa.total / 100) * percentage;
      if (ds2) {
        iLines.push({
          code: fa.tpvId,
          date: period.emitionDate.format('YYYY-MM-DD HH:mm:ss'),
          productKey: `contractDiscount:${contract.id}`,
          contractId: contract.id,
          concpet: `Descompte adicional `,
          quantity: Number(-(Math.round(ds2 * 100) / 100)).toString(),
          parameters,
          scheduledId,
          sectionCode: contract.section.sectionName,
        });
        hasContractDiscount = true;
        abstract.extraProcess.push('Applied contract discount');
      }
    }

    if (cons?.contractHistory?.blocked?.length) {
      let daysBlocked = 0;
      for (const blockPeriod of cons.contractHistory.blocked) {
        daysBlocked += daysBetweenTwoDates(blockPeriod.init, blockPeriod.end);
      }

      if (daysBlocked > 5) {
        abstract.extraProcess.push(
          'Removing discounts because period has blocked days',
        );
      }
    }

    for (const discount of discounts) {
      let _discAmount = 0;
      const _discountLines = generateDiscountLines(discount, cons, type);
      if (_discountLines.executed.id) {
        abstract.discountsExecuted.push({
          matrixId: _discountLines.executed.matrixId,
          init: _discountLines.executed.init,
          end: _discountLines.executed.end,
          executedId: _discountLines.executed.id,
          active: _discountLines.executed.active,
        });
      }
      const discountLines = _discountLines.iLines;
      for (const dLines of discountLines) {
        const discountLine: InvoiceLine = {
          ...dLines,
          contractId: contract.id,
          concpet: `${dLines.concpet ?? ''} / ${discount.type}`,
          parameters,
          scheduledId,
          quantity: Number(dLines.quantity).toFixed(2),
          date: period.emitionDate.format('YYYY-MM-DD HH:mm:ss'),
          sectionCode: contract.section.sectionName,
        };
        _discAmount += Number(Number(dLines.quantity).toFixed(2));
        iLines.push(discountLine);
      }

      if (contract.holders?.length ?? 0) {
        await setApplied(discount, _discAmount, null, control_row_id, userId);
      } else {
        const { histories, nextScheduled, scheduled } =
          await setAppliedInvoiceProcess(
            discount,
            _discAmount,
            null,
            control_row_id,
            userId,
          );
        discountChanges.histories.push(...histories);
        if (nextScheduled) discountChanges.newScheduled.push(nextScheduled);
        discountChanges.updateScheduled.push(scheduled);
      }

      if ((cons?.contractHistory?.holders?.length ?? 0) > 1) {
        const numberOfDiscounts = await GfDiscountsScheduled.count({
          where: {
            contractId: discount.contractId,
            matrixId: discount.matrixId,
            date: discount.date,
            tpvCode: discount.tpvCode,
          },
        });

        if (
          numberOfDiscounts <
          (Object.keys(cons?.contractHistory?.holders).length ?? 0)
        ) {
          const newDiscount = discount.get({ plain: true });
          newDiscount.permanent = 0;
          newDiscount.description = `${newDiscount.description} (*)`;
          delete newDiscount.id;
          const { discount: generatedNewDiscount, history } =
            await generateCreateDiscountData(newDiscount, { userId });
          discountChanges.histories.push(history);
          discountChanges.newScheduled.push(generatedNewDiscount);
        }
      }
    }
  }

  if (ret?.consumption?.CELL) {
    if (
      moment(contract.dateActivation).isSameOrAfter(moment(period.initDate)) &&
      _.get(ret, 'consumption.CELL.section.row.simPaymentMethod', '') === 'banc'
    ) {
      iLines.push({
        code: 'SIM',
        date: period.emitionDate.format('YYYY-MM-DD HH:mm:ss'),
        contractId: contract.id,
        concpet: `Mobile SIM card (${specificReference})`,
        quantity: '4.96',
        parameters,
        productKey: `simCard:${contract.id}`,
        scheduledId,
        sectionCode: contract.section.sectionName,
      });
    }
  }
  const recordedLines = [];
  for (const line of iLines) {
    const row = {
      code: line.code,
      date: line.date,
      productKey: line.productKey,
      description: line.concpet,
      quantity: line.days,
      total: line.quantity,
      clientId: client.id,
      contractId: line.contractId,
      sentToTpv: 0,
      tpvReference: '',
      parameters: line.parameters,
      scheduledId: line.scheduledId,
      sectionCode: contract.section.sectionName,
    };
    recordedLines.push(row);
  }

  return {
    lines: recordedLines,
    toReview,
    abstract,
    contractId: contract.id,
    cellInvoiceLine,
    discountChanges,
  };
};

const isLemonFeeWithBono = (feeAbstract: AnyModel) => {
  const extraData = JSON.parse(feeAbstract.extraData ?? '{}');
  return extraData.packageIDBono ? true : false;
};

export const getTotalPeriod = async (
  contract: AnyModel,
  client: AnyModel,
  period: PeriodType,
  control_row_id: number,
  comeFromControlRows = false,
) => {
  const dateActivation = moment(contract.dateActivation);
  if (!period.initDate.isValid() || dateActivation.isAfter(period.initDate)) {
    period.initDate = dateActivation;
  }

  const dateDeactivation =
    contract.dateDeactivation &&
    contract.dateDeactivation !== '0000-00-00 00:00:00' &&
    contract.dateDeactivation !== '1970-01-01 00:00:00'
      ? moment(contract.dateDeactivation)
      : moment(null);
  let comeFromDeactivation = false;
  if (
    dateDeactivation &&
    dateDeactivation.isValid() &&
    period.endDate.isAfter(dateDeactivation)
  ) {
    period.endDate = dateDeactivation.subtract(1, 'minutes');
    comeFromDeactivation = true;
  }

  if (
    !comeFromDeactivation &&
    period.endDate.format('HH:mm:ss') === '00:00:00'
  ) {
    period.endDate.endOf('day');
  }

  let sections = null;
  if (comeFromControlRows)
    sections = await GfContractSectionStatusService.getAllForContract(
      contract.id,
    );
  else
    sections = (await GfContractSectionStatusService.getAllCached())[
      contract.id
    ];
  if (!sections)
    throw new Error(
      `contract (${contract.id}) without sections or contract not exists'`,
    );

  const typeHandlers = {
    CELL: getCell,
    INTERNET: getInternet,
    FIX: getFix,
    TV: getTv,
    SUBSCRIPTION: getSubscription,
  };

  const totals: {
    [K in keyof typeof typeHandlers]: Awaited<
      ReturnType<(typeof typeHandlers)[K]>
    >;
  } = {};

  for (const [type, section] of Object.entries(sections)) {
    if (!['blocked', 'active', 'suspended'].includes(contract.state)) continue;
    if (period.initDate.isAfter(period.endDate)) {
      totals[type] = {
        contractId: contract.id,
        clientId: client.id,
        period,
        invoiceLinesIds: [],
        fees: {},
        bonos: {},
        holders: {},
        blocked: [],
        discountsExecuted: [],
        extraProcess: [],
      };
      _.set(totals, `${type}.section`, section);
      continue;
    }

    const typeHandlerFn = typeHandlers[type as SERVICE];
    if (!typeHandlerFn) continue;

    const result = await typeHandlerFn(
      client,
      contract,
      period,
      section.row.number,
    );

    //Type is CELL
    if (typeof result !== 'string' && 'invoiceLineRow' in result) {
      result.invoiceLineRow.contractId = contract.id;
      result.invoiceLineRow.invoiceClientId = client.invoiceClientId;
      if (control_row_id) result.invoiceLineRow.controlRowId = control_row_id;
    }
    totals[type] = result;
    _.set(totals, `${type}.section`, section);
  }
  return totals;
};

export const calculateLocalFeesAndBonos = async (
  history: Awaited<ReturnType<typeof GfContractService.getContractHistory>>,
  months: Record<string, Month>,
  wantedClientId: number,
) => {
  let iBlocks = [];
  let bInit = '1970-01-01';
  await initAllBono();
  for (const block of history.blocked) {
    iBlocks.push({
      init: bInit,
      end: block.init,
    });
    bInit = block.end;
  }
  iBlocks.push({
    init: bInit,
    end: '2500-01-01',
  });

  iBlocks = iBlocks.filter((blockObject) =>
    moment(blockObject.end).isAfter(moment(blockObject.init)),
  );
  if (!iBlocks.length) {
    iBlocks = [
      {
        init: '1970-01-01',
        end: '2500-01-01',
      },
    ];
  }

  const contractBlocks: Record<
    string,
    { feeId: string; init: string; end: string }[]
  > = {};
  for (const clientId in history.holders) {
    const holderPeriods = history.holders[clientId];
    for (const holderPeriod of holderPeriods) {
      for (const feeId in history.fees) {
        const feePeriods = history.fees[feeId];
        for (const feePeriod of feePeriods) {
          for (const year_month_key in months) {
            const year_month = months[year_month_key];
            const min_max = findMinMaxBetweenThreeDates(
              year_month.init,
              year_month.end,
              holderPeriod.init,
              holderPeriod.end,
              feePeriod.init,
              feePeriod.end,
            );
            if (!contractBlocks[clientId]) contractBlocks[clientId] = [];
            contractBlocks[clientId].push({
              feeId,
              init: min_max.from,
              end: min_max.to,
            });
          }
        }
      }
    }
  }

  const blocks: Record<
    string,
    {
      feeId: string;
      init: string;
      end: string;
      proportion: number;
      quote: number;
      daysInBlock: number;
    }[]
  > = {};
  for (const clientId in history.holders) {
    for (const iblocked of iBlocks) {
      for (const cbl of contractBlocks[clientId] ?? []) {
        for (const year_month_key in months) {
          const year_month = months[year_month_key];
          const min_max = findMinMaxBetweenThreeDates(
            year_month.init,
            year_month.end,
            cbl.init,
            cbl.end,
            iblocked.init,
            iblocked.end,
          );
          const conditions = await GfFeeService.getPrice(Number(cbl.feeId));
          const blockDays =
            Math.round(
              twoDatesDaysSwaping(
                iblocked.init,
                iblocked.end,
                year_month.init,
                year_month.end,
              ) * 10,
            ) / 10; // CHECK
          if (blockDays <= 0) {
            continue;
          }
          if (!blocks[clientId]) {
            blocks[clientId] = [];
          }
          const proportion = (blockDays / year_month.daysInMonth) * 100;
          blocks[clientId].push({
            feeId: cbl.feeId,
            init: min_max.from,
            end: min_max.to,
            proportion,
            quote: (conditions?.baseQuote / 100 ?? 0) * proportion,
            daysInBlock: blockDays,
          });
        }
      }
    }
  }

  const days: Record<
    string,
    {
      fees: Record<string, Record<string, number>>;
      bonos: Record<string, Record<string, Record<string, number>>>;
    }
  > = {};
  for (const _clientId in history.holders) {
    const holderPeriods = history.holders[_clientId];
    for (const holderPeriod of holderPeriods) {
      for (const feeId in history.fees) {
        const feePeriods = history.fees[feeId];
        for (const feePeriodKey in feePeriods) {
          const feePeriod = feePeriods[feePeriodKey];
          for (const year_month in months) {
            const year_month_value = months[year_month];
            const days_between = threeDatesDaysSwaping(
              year_month_value.init,
              year_month_value.end,
              feePeriod.init,
              feePeriod.end,
              holderPeriod.init,
              holderPeriod.end,
            );
            const daysKey = [_clientId, 'fees', feeId, year_month];
            const oldValue = _.get(days, daysKey, 0);
            _.setWith(days, daysKey, days_between + oldValue, Object);

            for (const blockedPeriod of history.blocked) {
              const days_between = threeDatesDaysSwaping(
                year_month_value.init,
                year_month_value.end,
                feePeriod.init,
                feePeriod.end,
                blockedPeriod.init,
                blockedPeriod.end,
              );
              const oldValue = _.get(days, daysKey) ?? 0;
              const newValue =
                oldValue - Math.abs(days_between) < 0
                  ? 0
                  : oldValue - Math.abs(days_between);
              _.setWith(days, daysKey, newValue, Object);
            }
          }
        }
      }

      for (const bonoId in history.bonos) {
        const bonoXref = history.bonos[bonoId];
        for (const xref in bonoXref) {
          const bonoPeriods = bonoXref[xref];
          for (const bonoPeriod of bonoPeriods) {
            for (const year_month in months) {
              const daysKey = [_clientId, 'bonos', bonoId, xref, year_month];
              const year_month_value = months[year_month];
              const oldValue = _.get(days, daysKey) ?? 0;
              const days_between = threeDatesDaysSwaping(
                year_month_value.init,
                year_month_value.end,
                bonoPeriod.init,
                bonoPeriod.end,
                holderPeriod.init,
                holderPeriod.end,
              );
              _.setWith(days, daysKey, oldValue + days_between, Object);
              for (const blockedPeriod of history.blocked) {
                const days_between = threeDatesDaysSwaping(
                  year_month_value.init,
                  year_month_value.end,
                  bonoPeriod.init,
                  bonoPeriod.end,
                  blockedPeriod.init,
                  blockedPeriod.end,
                );
                const oldValue = _.get(days, daysKey) ?? 0;
                const newValue =
                  oldValue - Math.abs(days_between) < 0
                    ? 0
                    : oldValue - Math.abs(days_between);
                _.setWith(days, daysKey, newValue, Object);
              }
            }
          }
        }
      }
    }
  }

  const wanted = days[wantedClientId];
  const feeAbstract: Record<
    string,
    {
      days: number;
      total: number;
      tpvId: string;
      productKey: string;
      description: string;
      extraData: string;
    }
  > = {};
  let totalBaseQuotes = 0;

  for (const feeGroupId in wanted?.fees ?? {}) {
    const fee = wanted.fees[feeGroupId];
    const conditions = await GfFeeService.getPrice(feeGroupId);
    let total = 0;
    let totalDays = 0;

    for (const monthKey in fee) {
      const days = fee[monthKey];
      const daysInMonth = months[monthKey].daysInMonth;
      const pricePerDay = (conditions?.baseQuote ?? 0) / daysInMonth;
      total += pricePerDay * days;
      totalDays += days;
    }

    if (!totalDays) {
      continue;
    }

    feeAbstract[feeGroupId] = {
      days: totalDays,
      total,
      tpvId: conditions?.tpvCode,
      productKey: `fee:${feeGroupId}`,
      description: conditions?.description,
      extraData: conditions?.extraData,
    };

    totalBaseQuotes += total;
  }

  const bonosAbstract: Record<
    string,
    {
      days: number;
      total: number;
      tpvId: string;
      xrefId: string;
      productKey: string;
      description: string;
    }[]
  > = {};
  let totalBonos = 0;
  for (const bonoId in wanted?.bonos ?? {}) {
    const bonoXref = wanted.bonos[bonoId];
    const bonoRow = AllBono[bonoId];
    for (const xref in bonoXref) {
      const bono = bonoXref[xref];
      let total = 0;
      let totalDays = 0;
      for (const monthKey in bono) {
        const days = bono[monthKey];
        if (bonoRow?.prorotable) {
          const daysInMonth = months[monthKey].daysInMonth;
          const pricePerDay = parseFloat(bonoRow.pvp) / daysInMonth;
          total += pricePerDay * days;
        } else {
          if (days) {
            total += parseFloat(bonoRow.pvp);
          }
        }
        totalDays += days;
      }

      if (!totalDays) {
        continue;
      }

      const relatedBono = bonosAbstract[bonoId] ?? [];
      relatedBono.push({
        days: totalDays,
        total,
        tpvId: bonoRow.tpvCode,
        xrefId: xref.replace('xref-', ''),
        productKey: `bono:${bonoRow.id}`,
        description: bonoRow.name,
      });
      bonosAbstract[bonoId] = relatedBono;
      totalBonos += total;
    }
  }

  const bigTotal = totalBaseQuotes + totalBonos;

  return {
    total: bigTotal / 100,
    baseQuote: totalBaseQuotes / 100,
    feeAbstract,
    bonosAbstract,
    contractHistory: history,
    monthsPeriod: months,
    contractBlocks: blocks[wantedClientId],
    blocked: history.blocked,
  };
};

export const getLocalMenagedFeesAndBonos = async (
  client: AnyModel,
  contract: AnyModel,
  period: PeriodType,
) => {
  const history = await GfContractService.getContractHistory(
    contract,
    period.initDate,
    period.endDate,
  );
  const months = await getMonths(period.initDate, period.endDate);
  return calculateLocalFeesAndBonos(history, months, client.id);
};

const getInternet = async (
  client: AnyModel,
  contract: AnyModel,
  period: PeriodType,
) => {
  return getLocalMenagedFeesAndBonos(client, contract, period);
};

const getFix = async (
  client: AnyModel,
  contract: AnyModel,
  period: PeriodType,
) => {
  const ret = await getLocalMenagedFeesAndBonos(client, contract, period);
  const startOfPeriod = moment(period.initDate)
    .startOf('day')
    .format('YYYY-MM-DD HH:mm:ss');
  const endOfPeriod = moment(period.endDate)
    .endOf('day')
    .format('YYYY-MM-DD HH:mm:ss');

  const chargsKey = moment(period.initDate)
    .startOf('month')
    .format('YYYY-MM-DD');
  let total = 0;
  if (!chargsFix[chargsKey]?.[contract.id]) {
    const charge = await GfKamailioUnifiedCdr.findAll({
      where: {
        contractId: contract.id,
        date: {
          [Op.between]: [startOfPeriod, endOfPeriod],
        },
      },
      attributes: [[fn('SUM', col('userCharge')), 'charge']],
    });
    total =
      Math.round(Number(charge[0]?.get({ plain: true }).charge ?? 0) * 100) /
      100;
  } else {
    total = chargsFix[chargsKey][contract.id];
  }

  return {
    ...ret,
    consumptionAbstract: [
      {
        tpvId: 'FIXCONSUM2',
        total,
        productKey: `consumKamailioUnifiedCdr:${contract.id}:${startOfPeriod}->${endOfPeriod}`,
      },
    ],
  };
};

const chargsFix: Record<string, Record<string, number>> = {};
export const cahchedChargeFix = async (period: AnyModel) => {
  const startOfPeriod = moment(period.period)
    .subtract(1, 'months')
    .startOf('day')
    .format('YYYY-MM-DD HH:mm:ss');
  const endOfPeriod = moment(period.period)
    .subtract(1, 'seconds')
    .endOf('day')
    .format('YYYY-MM-DD HH:mm:ss');

  const unifiedCdrs = await GfKamailioUnifiedCdr.findAll({
    where: {
      date: {
        [Op.between]: [startOfPeriod, endOfPeriod],
      },
      userCharge: { [Op.gt]: 0 },
    },
  });

  const chargsKey = moment(period.period)
    .subtract(1, 'month')
    .format('YYYY-MM-DD');
  chargsFix[chargsKey] = {};
  for (const unifiedCdr of unifiedCdrs) {
    const charge = chargsFix[chargsKey]?.[`${unifiedCdr.contractId}`] ?? 0;
    _.set(
      chargsFix[chargsKey],
      unifiedCdr.contractId,
      charge + (unifiedCdr.userCharge ? Number(unifiedCdr.userCharge) : 0),
    );
  }
};

const chargsLemon: Record<string, Record<string, number>> = {};
export const cahchedChargeLemon = async (period: AnyModel) => {
  const startOfPeriod = moment(period.period)
    .subtract(1, 'months')
    .startOf('day')
    .format('YYYY-MM-DD HH:mm:ss');
  const endOfPeriod = moment(period.period)
    .subtract(1, 'seconds')
    .endOf('day')
    .format('YYYY-MM-DD HH:mm:ss');

  const lemonActivities = await GfAireCdr2.findAll({
    where: {
      fecha: {
        [Op.between]: [startOfPeriod, endOfPeriod],
      },
      descripcion: { [Op.like]: '%(L)%' },
      importe: { [Op.gt]: 0 },
    },
  });

  const chargsKey = moment(period.period)
    .subtract(1, 'month')
    .format('YYYY-MM-DD');
  chargsLemon[chargsKey] = {};
  for (const lemonActivity of lemonActivities) {
    const charge = chargsLemon[chargsKey]?.[`${lemonActivity.origen}`] ?? 0;
    _.set(
      chargsLemon[chargsKey],
      lemonActivity.origen,
      charge + (lemonActivity.importe ? Number(lemonActivity.importe) : 0),
    );
  }
};

const getTv = async (
  client: AnyModel,
  contract: AnyModel,
  period: PeriodType,
) => {
  return getLocalMenagedFeesAndBonos(client, contract, period);
};

const getSubscription = async (
  client: AnyModel,
  contract: AnyModel,
  period: PeriodType,
) => {
  return getLocalMenagedFeesAndBonos(client, contract, period);
};

const getCell = async (
  client: AnyModel,
  contract: AnyModel,
  period: PeriodType,
  number: string,
) => {
  const providerCode =
    (contract.activeFee?.cellProviderId ?? 0) === 2
      ? CELL_PROVIDER_CODE.LEMON
      : CELL_PROVIDER_CODE.AIRE;

  if (providerCode === CELL_PROVIDER_CODE.LEMON) {
    const ret = await getLocalMenagedFeesAndBonos(client, contract, period);
    const startOfPeriod = moment(period.initDate)
      .startOf('day')
      .format('YYYY-MM-DD HH:mm:ss');
    const endOfPeriod = moment(period.endDate)
      .endOf('day')
      .format('YYYY-MM-DD HH:mm:ss');

    const chargsKey = moment(period.initDate)
      .startOf('month')
      .format('YYYY-MM-DD');

    let total = 0;
    if (!chargsLemon[chargsKey]?.[number]) {
      const charge = await GfAireCdr2.findAll({
        where: {
          origen: number,
          fecha: {
            [Op.between]: [startOfPeriod, endOfPeriod],
          },
        },
        attributes: [[fn('SUM', col('importe')), 'charge']],
      });
      total =
        Math.round(Number(charge[0]?.get({ plain: true }).charge ?? 0) * 100) /
        100;
    } else {
      total = chargsLemon[chargsKey][number];
    }

    const consumptionAbstract = [];
    if (total)
      consumptionAbstract.push({
        tpvId: 'LEMONCONSUM',
        total,
        productKey: `consumLemonCdr:${contract.id}:${startOfPeriod}->${endOfPeriod}`,
      });

    return {
      ...ret,
      consumptionAbstract,
    };
  }

  return FacadeCell.getILines(
    number,
    client.fiscalId,
    period.initDate,
    providerCode,
  );
};

const zeroifica = (number: string, length: number) => {
  const paddedNumber = number.padStart(length, '0');
  return paddedNumber.slice(-length);
};

export const generateInvoice = async (
  client: AnyModel,
  date: Moment,
  iLines: Awaited<ReturnType<typeof generateIlines>>['lines'],
  invoiceKey: string,
  paymentTypeId: number,
  userId: number,
) => {
  if (client.defaulter || !client.active)
    return {
      invoice: undefined,
      lines: [] as InvoiceLine[],
    };

  const invoiceLines = [];
  const products: Record<string, AnyModel> =
    await InvoiceProductService.getIndexedInvoiceProducts('code');
  for (const line of iLines) {
    const referer = {
      app: 'goufone',
      key: `contractId:${line.contractId}`,
      data: JSON.stringify({
        productKey: line.productKey,
        days: line.quantity,
        type: line.sectionCode,
      }),
    };

    const prod = products[line.code];

    if (!prod)
      throw Error(
        `product with code PC:${line.code}/RK:${line.productKey}/C:${line.contractId} not found - ${line.description}`,
      );

    const params = JSON.parse(line.parameters ? line.parameters : '{}');
    if (params?.ip ?? false) {
      delete params.ip;
    }

    const description =
      prod.code === 'FIXCONSUM2' ||
      prod.code === 'LEMONCONSUM' ||
      prod.code === 'FIXCONSUM3' ||
      prod.code === 'DESCGEN' ||
      prod.code === 'CHARGE_TECHNICIAN' ||
      prod.code === 'DISCOUNT_TECHNICIAN' ||
      prod.code === 'GENDESC'
        ? line.description
        : null;
    if (!prod.noBillable) {
      invoiceLines.push(
        InvoiceLimboLineService.buildInvoiceLimboLineFromProduct(
          prod,
          1,
          null,
          description,
          Number(line.total),
          referer,
          params,
          [await getIva()],
        ),
      );
    }
  }

  invoiceKey = invoiceKey ? invoiceKey : `gfClient:${client.id}`;

  const serieId = await ConfigService.get('goufone', 'invoiceSerieId');

  const newInvoice = await createEmptyInvoiceForClientId(
    client.invoiceClient,
    date.format(`YYYY-MM-${zeroifica(client.payDay?.toString() ?? '1', 2)}`),
    'goufone',
    invoiceKey,
    serieId,
    paymentTypeId,
    client.invoiceClient?.invoice_profiles[0] ?? null,
    userId,
  );

  const lines = await setInvoiceLinesForAutomaticInvoice(invoiceLines);
  if (newInvoice) {
    consolideTotalsForAutomaticInvoice(newInvoice, lines);
  }
  return {
    invoice: newInvoice,
    lines,
  };
};

let iva: AnyModel | null = null;
export const getIva = async (force = false) => {
  if (iva === null || force) {
    iva = await InvoiceTaxType.findOne({
      where: {
        name: 'IVA',
      },
    });
  }
  return iva;
};

const createEmptyInvoiceForClientId = async (
  client: AnyModel,
  payDate: string,
  app: string,
  key: string,
  serieId: number,
  paymentTypeId: number,
  profile: AnyModel | null,
  userId: number,
) => {
  const clientObject = client.get({ plain: true });
  if (profile) {
    if (profile.clientId !== client.id)
      throw Error(`Profile not from this client`);

    if (profile) {
      clientObject.address = profile.address
        ? profile.address
        : clientObject.address;
      clientObject.countryCode = profile.countryCode
        ? profile.countryCode
        : clientObject.countryCode;
      clientObject.city = profile.city ? profile.city : clientObject.city;
      clientObject.state = profile.state ? profile.state : clientObject.state;
      clientObject.postalCode = profile.postalCode
        ? profile.postalCode
        : clientObject.postalCode;
      clientObject.number = profile.number
        ? profile.number
        : clientObject.number;
      clientObject.email = profile.email ? profile.email : clientObject.email;
    }
  }

  const invoiceDate = moment().format(dateFormat);

  const newInvoiceInvoiceData = {
    clientId: clientObject.id,
    serieId,
    clientNif: clientObject.nif,
    date: invoiceDate,
    payDate,
    clientName: clientObject.businessName,
    clientAddress: `${clientObject.address}${
      clientObject.number ? `, ${clientObject.number}` : ''
    }`,
    clientCity: clientObject.city,
    clientPostalCode: clientObject.postalCode,
    clientState: clientObject.state,
    clientCountryIso: clientObject.countryCode,
    refererApp: app,
    refererKey: key,
    paymentType: paymentTypeId,
    moneyTypeCode: 'EUR',
    userId,
    code: `TMP-${Math.floor(
      Math.random() * (999999999 - 111111111 + 1) + 111111111,
    )}`,
    total: 0,
  };

  return newInvoiceInvoiceData;
};

export const generateNextSchedulesLine = async (contractId: number) => {
  return Invoice_GfPointerService.generateContractPointers(contractId, true);
};

export const getPaymentTypeId = async (
  client: AnyModel,
  profileId: number | null = null,
) => {
  let typeId = client.paymentTypeId;
  if (profileId) {
    const profile = await InvoiceClientsInvoiceProfile.findByPk(profileId);
    assert(profile, `profile with id ${profileId} not found`);
    if (profile.payTypeId > 0) {
      typeId = profile.payTypeId;
    }
  }

  return typeId as number;
};

const generateAddressForInvoiceLine = (
  internetSection: AnyModel | undefined,
) => {
  return (
    (internetSection?.addressStreet
      ? `${internetSection?.addressStreet},`
      : '') +
    (internetSection?.addressNumber
      ? `${internetSection?.addressNumber},`
      : '') +
    (internetSection?.addressCity ? `${internetSection?.addressCity}` : '')
  );
};

export const setAppliedInvoiceProcess = async (
  discount: AnyModel,
  totalApplied: number,
  scheduledInvoiceLine: AnyModel | null,
  control_row_id: number,
  userId: number,
) => {
  const histories = [];

  const state = (await isDiscountMultiClient(discount, scheduledInvoiceLine))
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

  const { discount: toUpdateDiscount, history: toCreateDiscountHistory } =
    await generateUpdatedDiscountData(
      discount,
      { state },
      { userId, controlRowId: control_row_id, totalApplied },
    );
  histories.push(toCreateDiscountHistory);
  let nextScheduled = null;
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
    if (nextDiscount === null) {
      const {
        discount: toCreateDiscount,
        history: toCreatePermanentDiscountHistory,
      } = await generateCreateDiscountData(
        {
          ...replicate,
          permanent: 1,
          permanentParentId: discount.id,
        },
        { userId },
      );
      nextScheduled = toCreateDiscount;
      histories.push(toCreatePermanentDiscountHistory);
    }
  }

  return {
    scheduled: toUpdateDiscount,
    nextScheduled,
    histories,
  };
};
