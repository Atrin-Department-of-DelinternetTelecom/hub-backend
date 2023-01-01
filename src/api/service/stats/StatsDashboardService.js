// @ts-check
'use strict';

const knex = require('@lib/knex').intranet;
const { respondSuccess } = require('@utils/response');
const moment = require('moment');
const config = require('@config');
const _ = require('lodash');

/** @typedef {import("moment").Moment} Moment */

/**
 * Normalize the given data structure
 *
 * @param {{ date: Date, count: number }[]} rows
 * @param {Moment} startDate
 *
 * @returns {{ date: Moment, count: number }[]}
 */
function normalize(rows, startDate) {
  const map = Object.fromEntries(
    rows.map((row) => {
      const date = moment(row.date);
      const key = date.format('YYYY-MM-DD');
      return [key, { date, count: row.count }];
    }),
  );

  /** @type {typeof map} */
  const result = {};

  const temp = startDate.clone();
  const today = moment().startOf('day');
  while (temp.isBefore(today)) {
    const key = temp.format('YYYY-MM-DD');
    result[key] = map[key] ?? { date: temp.clone(), count: 0 };
    temp.add(1, 'day');
  }

  return Object.values(result);
}

/**
 *
 * @param {{ date: Moment, count: number }[]} arr
 * @returns {number}
 */
const avg = (arr) => sum(arr) / arr.length;

/**
 *
 * @param {{ date: Moment, count: number }[]} arr
 * @returns {number}
 */
const sum = (arr) => arr.reduce((a, b) => a + b.count, 0);

/**
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
const last = (arr) => arr[arr.length - 1];

const GRAPH_MAX_DOTS = 24;

/**
 * @param {{ date: Moment, count: number }[]} data
 * @returns
 */
const downscaleGraph = (data) => {
  // if not enough data, we can't do anything, return the original data
  if (data.length <= GRAPH_MAX_DOTS) {
    return data.map((row) => row.count.toFixed(2));
  }

  const chunkCount = Math.floor(data.length / GRAPH_MAX_DOTS);

  if (chunkCount === 1) {
    return data.map((row) => row.count.toFixed(2));
  }
  const grouped = _.chunk(data, chunkCount);

  if (last(grouped).length < grouped[0].length) {
    // remove last group, because it's not complete
    grouped.pop();
  }

  return grouped.map((row) => avg(row).toFixed(2));
};

/**
 *
 * @param {number} oldValue
 * @param {number} newValue
 * @returns {string}
 */
const percent = (oldValue, newValue) => {
  const change = newValue - oldValue;
  const percent = (change / oldValue) * 100;
  return percent.toFixed(2);
};

/**
 * @param {{ date: Moment, count: number }[]} allTimeData
 * @param {{ unit: 'week' | 'month', value: number }} last
 * @returns {{ value: number, change_percent: string, graph: string[]}}
 */
const chartInfo = (allTimeData, { unit, value }) => {
  const today = moment().startOf('day');
  const startOfCurrentRange = today.clone().subtract(value, unit);
  const startOfLastRange = today.clone().subtract(value * 2, unit);

  const currentRangeData = allTimeData.filter((d) =>
    d.date.isBetween(startOfCurrentRange, today, null, '[)'),
  );

  const previousRangeData = allTimeData.filter((d) =>
    d.date.isBetween(startOfLastRange, startOfCurrentRange, null, '[)'),
  );

  const sumOfCurrentRange = sum(currentRangeData);
  const sumOfPreviousRange = sum(previousRangeData);

  return {
    value: sumOfCurrentRange,
    change_percent: percent(sumOfPreviousRange, sumOfCurrentRange),
    graph: downscaleGraph(currentRangeData),
  };
};

exports.getClientsStats = async () => {
  const today = moment().startOf('day');
  const oneYearAgo = today.clone().subtract(1, 'year');

  /** @type {{ date: Date, count: number }[]} */
  const rows = await knex
    .queryBuilder()
    .from(
      knex('gf_contracts')
        .select(
          'gf_contracts.clientId',
          knex.raw('DATE(MIN(gf_contracts.dateActivation)) as date'),
        )
        .where({
          'gf_contracts.uid': config.get('index.intranet.uid'),
          'gf_contracts.status': 1,
        })
        .where('gf_contracts.state', '<>', 'pendingSectionsReady')
        .andWhere('gf_contracts.dateActivation', '>=', oneYearAgo.toDate())
        .groupBy('gf_contracts.clientId')
        .as('clients'),
    )
    .select('clients.date')
    .count('*', { as: 'count' })
    .groupBy('clients.date');

  const [{ total_clients }] = await knex('gf_contracts')
    .countDistinct('clientId', { as: 'total_clients' })
    .where({
      uid: config.get('index.intranet.uid'),
      status: 1,
      state: 'active',
    });

  const data = normalize(rows, oneYearAgo);

  return respondSuccess({
    all_time: {
      value: total_clients,
      graph: chartInfo(data, { value: 12, unit: 'month' }).graph,
    },
    last_six_months: chartInfo(data, { value: 6, unit: 'month' }),
    last_three_months: chartInfo(data, { value: 3, unit: 'month' }),
    current_month: chartInfo(data, { value: 1, unit: 'month' }),
    current_week: chartInfo(data, { value: 1, unit: 'week' }),
  });
};
