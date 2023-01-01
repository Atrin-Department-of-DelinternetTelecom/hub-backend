// @ts-check
'use strict';

const moment = require('moment');
const _ = require('lodash');

const { associateBy } = require('@utils/collections');
const knex = require('@lib/knex').intranet;

/** @typedef {ChartColumn[]} Chart */

/** @typedef {{ label: string, step: string, stats: Record<string, ChartPropData> }} ChartColumn */

/** @typedef {{ count: number, avg?: string }} ChartPropData */

const steps = {
  year: {
    groupFormat: '%Y',
    viewFormat: '%Y',
  },
  month: {
    groupFormat: '%Y-%m',
    viewFormat: '%Y-%m',
  },
  week: {
    groupFormat: '%Y-#%U',
    viewFormat: '%Y-%m-%d',
  },
  day: {
    groupFormat: '%Y-%m-%d',
    viewFormat: '%Y-%m-%d',
  },
};

/**
 * @template T, U
 * @param {Record<string, T>} input
 * @param {(t: T) => U} map
 * @return {Record<string, U>}
 */
function map(input, map, initObject = {}) {
  /** @type {any} */
  const newObject = initObject;
  for (const key in input) {
    newObject[key] = map(input[key]);
  }

  return newObject;
}

/**
 *
 * @param {string[]} keys
 * @returns {Record<string, ChartPropData>}
 */
function makeInitObject(keys) {
  /** @type {any} */
  const initObject = {};
  for (const key of keys) {
    initObject[key] = {
      count: 0,
    };
  }
  return initObject;
}

/**
 *
 * @param {{ prop: string, date: string, count: number, avg?: string }[]} input
 * @param {string[]} keys
 * @param {boolean=} isWeekly
 * @return {Record<string, Record<string, ChartPropData>>}
 */
function group(input, keys, isWeekly = false) {
  const groupedByDate = _.groupBy(input, 'date');
  const groupedByProp = map(groupedByDate, (data) =>
    map(
      associateBy(data, (e) => e.prop),
      (e) => ({
        count: e.count,
        avg: e.avg ? Number(e.avg).toFixed(2) : undefined,
      }),
      makeInitObject(keys),
    ),
  );

  if (isWeekly) {
    /** @type {typeof groupedByProp} */
    const result = {};
    for (const key in groupedByProp) {
      const date = moment(key, 'YYYY-#WW').format('YYYY-MM-DD');
      result[date] = groupedByProp[key];
    }
    return result;
  }

  return groupedByProp;
}

function label(range, stepSize) {
  if (stepSize === 'day') {
    return range.start.format('MMMM D');
  }

  if (stepSize === 'week') {
    return (
      range.start.format('MMMM D') +
      ' - ' +
      range.end.add(-1, 'd').format('MMMM D')
    );
  }

  if (stepSize === 'month') {
    return range.start.format('MMMM');
  }

  return range.start.format('YYYY');
}

/**
 * ATTENTION: This function will mutate the input object
 * @param {Chart} input
 */
exports.accumulate = (input) => {
  const initStats = {};

  for (const periodData of input) {
    for (const key in periodData.stats) {
      if (!initStats[key]) initStats[key] = 0;

      periodData.stats[key].count += initStats[key];
      initStats[key] = periodData.stats[key].count;
    }
  }
};

/**
 *
 * @param {{
 *   sql: any,
 *   keys: string[],
 *   stepSize: 'year' | 'month' | 'week' | 'day',
 *   startDate: moment.Moment,
 *   endDate: moment.Moment,
 *   dateColumn: string,
 *   avg?: string,
 * }} param0
 * @returns {Promise<Chart>}
 */
exports.buildChart = async ({
  sql: subQuery,
  keys,
  stepSize,
  startDate,
  endDate,
  dateColumn,
  avg,
}) => {
  startDate = startDate.clone().startOf(stepSize);
  endDate = endDate.clone().endOf(stepSize);
  const { groupFormat } = steps[stepSize];

  const query = knex
    .queryBuilder()
    .from(
      subQuery
        .clone()
        .whereBetween(dateColumn, [startDate.toDate(), endDate.toDate()])
        .as('query'),
    )
    .count('*', { as: 'count' })
    .select('prop')
    .select(knex.raw(`DATE_FORMAT(date, ?) as date`, groupFormat))
    .groupByRaw(`DATE_FORMAT(date, ?), prop`, groupFormat);

  if (avg) {
    query.avg(avg, { as: 'avg' });
  }

  const ungroupedData = await query;

  const data = group(ungroupedData, keys, stepSize === 'week');
  const availableDates = Object.keys(data);

  /** @type {ChartColumn[]} */
  const result = [];
  let date = startDate.clone();

  const totalRanges = endDate.diff(startDate, stepSize) + 1;
  for (let i = 0; i < totalRanges; i++) {
    const range = {
      start: date,
      end: date.clone().add(1, stepSize),
    };

    const dateLabel = availableDates.find((dateLabel) =>
      moment(dateLabel).isBetween(range.start, range.end, undefined, '[)'),
    );

    /** @type {Record<string, ChartPropData>} */
    let stats;
    if (dateLabel) {
      stats = data[dateLabel];
    }

    if (!stats) {
      stats = makeInitObject(keys);
    }

    result.push({
      label: label(
        { start: range.start.clone(), end: range.end.clone() },
        stepSize,
      ),
      step: stepSize,
      stats,
    });

    date = range.end;
  }

  return result;
};
