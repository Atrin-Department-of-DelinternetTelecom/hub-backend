'use strict';

import * as CheckInvoicePointersService from './CheckInvoicePointersService';

import moment, { Moment } from 'moment';
import { get } from './ConfigService';
import { AnyModel } from '@api/models';
import assert from 'assert';
import { _getInvolvedContracts } from './Invoice_GfClientInvoiceService';
import _ from 'lodash';

export const getPeriodPointer = async (
  contract: AnyModel,
  next = false,
  strict = false,
) => {
  if (!contract.invoiceMonths) throw new Error('no valid contract');

  const isRecursive = contract.invoiceMonths > 1000;
  const numMonths = isRecursive
    ? contract.invoiceMonths - 1000
    : contract.invoiceMonths;

  if (![1, 2, 3, 4, 6, 12].includes(numMonths))
    throw new Error('no valid number of months');

  const startDate = moment().startOf('year').subtract(numMonths, 'months');
  const computedPeriods: { initDate: Moment; endDate: Moment }[] = [];
  let current = 0;
  let searchedPeriod: {
    initDate: Moment;
    endDate: Moment;
  } | null = null;
  let isNext = false;
  for (let n = 0; n < 25; n += numMonths) {
    const endDate = moment(startDate)
      .add(numMonths, 'months')
      .subtract(1, 'days');
    computedPeriods[current++] = {
      initDate: startDate.clone(),
      endDate: endDate.clone(),
    };

    if (isNext) {
      searchedPeriod = computedPeriods[current - 1];
      isNext = false;
    }

    if (
      endDate.endOf('day').isSameOrAfter(moment()) &&
      startDate.isSameOrBefore(moment())
    ) {
      if (isRecursive) {
        searchedPeriod = computedPeriods[current - (next ? 1 : 2)];
      } else if (next) {
        isNext = true;
      } else {
        searchedPeriod = computedPeriods[current - 1];
      }
    }
    startDate.add(numMonths, 'months');
  }

  let payDay = contract.payDay;
  if (!payDay || payDay > 27) {
    payDay = await get('goufone', 'invoiceDay');
  }

  let payDate = undefined;

  assert(searchedPeriod, 'searchedPeriod is not setted');
  if (isRecursive && payDay > 0) {
    payDate = searchedPeriod.endDate.clone().add(payDay, 'days');
  }

  if (isRecursive && !(payDay > 0)) {
    payDate = searchedPeriod.endDate.clone().add(payDay + 4, 'days');
  }

  if (!isRecursive && payDay > 0) {
    payDate = searchedPeriod.endDate.clone().add(payDay - 1, 'days');
  }

  if (!isRecursive && !(payDay > 0)) {
    payDate = searchedPeriod.endDate.clone().add(payDay + 1, 'days');
  }

  assert(payDate, 'payDate is not setted');
  if (strict) {
    const startOfMonth = moment().startOf('month');
    const startOfSearchedEndDate = searchedPeriod.endDate
      .clone()
      .startOf('day');
    const startOfSearchedInitDate = searchedPeriod.initDate
      .clone()
      .startOf('day');

    if (isRecursive) {
      if (!startOfSearchedEndDate.add(1, 'day').isSame(startOfMonth))
        throw new Error('Period not found');
    } else if (!startOfSearchedInitDate.isSame(startOfMonth))
      throw new Error('Period not found');
  }

  return {
    period: {
      ...searchedPeriod,
      emitionDate: payDate.clone().startOf('month'),
      payDate,
      isRecursive,
    },
    contract,
  };
};

export const getPeriodPointerForContractIds = async (
  contract_informations: Awaited<ReturnType<typeof _getInvolvedContracts>>,
) => {
  const results = await Promise.all(
    Object.values(contract_informations).map((contract_information) => {
      return getPeriodPointer(contract_information.contract, false, true);
    }),
  );
  return Object.fromEntries(
    _.zip(Object.keys(contract_informations), results),
  ) as Record<string, Awaited<ReturnType<typeof getPeriodPointer>>>;
};

export const generateContractPointers = async function (
  contractId: number,
  next = false,
) {
  return CheckInvoicePointersService.checkPointers(contractId, next);
};

export const generateNextSchedulesLine = async function (contractId: number) {
  return generateContractPointers(contractId, true);
};
