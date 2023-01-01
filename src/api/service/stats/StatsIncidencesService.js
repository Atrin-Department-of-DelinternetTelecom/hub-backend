// @ts-check
'use strict';

const knex = require('@lib/knex').intranet;
const { respondSuccess } = require('@utils/response');
const moment = require('moment');
const config = require('@config');
const _ = require('lodash');
const { knexUsers, kUserIdRef } = require('./utils');
const { buildChart, accumulate } = require('../../utils/knex/chart');
const { getPinnedUsers } = require('./StatsPinUserService');
const { getAllRows } = require('@utils/knex/table');
const { countIf } = require('@utils/knex');
const { avg_time } = require('./subqueries/incidences');
const { contracts } = require('./subqueries/contracts');

const incidencesStats = () =>
  knex('gf_incidences')
    .select(
      'gf_incidences.userId',
      countIf('gf_incidences.closed', '=', 1, { as: 'closed_total' }),
      avg_time,
    )
    .count('*', { as: 'total' })
    .as('incidences_stat');

exports.getIncidencesChart = async function ({
  startDate: _startDate,
  endDate: _endDate,
  step,
  accumulated,
}) {
  step = step ?? 'month';
  accumulated = accumulated === 'true';

  const startDate = moment(_startDate);
  const endDate = _endDate ? moment(_endDate) : moment();

  const sql = knex('gf_incidences')
    .innerJoin(contracts(), {
      'gf_contracts.id': 'gf_incidences.contractId',
    })
    .where({
      'gf_incidences.uid': config.get('index.intranet.uid'),
      'gf_incidences.status': 1,
    })
    .select(
      'gf_contracts.service as prop',
      'gf_incidences.creationDate as date',
    );

  const chart = await buildChart({
    sql,
    startDate,
    endDate,
    stepSize: step,
    dateColumn: 'gf_incidences.creationDate',
    keys: ['radio', 'fibra', 'cell', 'fix', 'tv'],
  });

  if (accumulated) {
    // this function will mutate the chart
    accumulate(chart);
  }

  return respondSuccess(chart);
};

exports.getTimeToResolveChart = async function ({
  startDate: _startDate,
  endDate: _endDate,
  step,
  accumulated,
}) {
  step = step ?? 'month';
  accumulated = accumulated === 'true';

  const startDate = moment(_startDate);
  const endDate = _endDate ? moment(_endDate) : moment();

  const sql = knex('gf_incidences')
    .innerJoin(contracts(), {
      'gf_contracts.id': 'gf_incidences.contractId',
    })
    .where({
      'gf_incidences.uid': config.get('index.intranet.uid'),
      'gf_incidences.status': 1,
    })
    .andWhere(
      'gf_incidences.executedDate',
      '>',
      knex.ref('gf_incidences.creationDate'),
    )
    .select(
      'gf_contracts.service as prop',
      knex.raw(
        '(TIMESTAMPDIFF(HOUR, gf_incidences.creationDate, gf_incidences.executedDate) / 24) as days_to_resolve',
      ),
      knex.raw(
        'TIMESTAMPDIFF(MINUTE, gf_incidences.creationDate, gf_incidences.executedDate) as minutes_to_resolve',
      ),
      'gf_incidences.creationDate as date',
    )
    .having('minutes_to_resolve', '>', 15);

  const chart = await buildChart({
    sql,
    startDate,
    endDate,
    stepSize: step,
    dateColumn: 'gf_incidences.creationDate',
    keys: ['radio', 'fibra', 'cell', 'fix', 'tv'],
    avg: 'days_to_resolve',
  });

  if (accumulated) {
    // this function will mutate the chart
    accumulate(chart);
  }

  return respondSuccess(chart);
};

const formatTime = (avg_time) => {
  if (!avg_time) return null;
  avg_time = parseFloat(avg_time);
  if (avg_time > 48) return `${Math.round(avg_time / 24)} Days`;
  return `${avg_time.toFixed(1)} Hours`;
};

exports.getIncidencePerUser = async function ({
  startDate,
  endDate,
  ...query
}) {
  /** @type {[Date, Date]}  */
  const dateRange = [
    moment(startDate).toDate(),
    moment(endDate).endOf('day').toDate(),
  ];

  const pinned = await getPinnedUsers('incidences-per-user');

  const incidencesPerUser = incidencesStats()
    .whereBetween('gf_incidences.creationDate', dateRange)
    .groupBy('gf_incidences.userId');

  const sql = knexUsers({ pinned })
    .select('avg_time', 'total', 'closed_total')
    .innerJoin(incidencesPerUser, {
      'incidences_stat.userId': kUserIdRef,
    })
    .having('total', '>', 0)
    .orderBy('total', 'desc');

  return getAllRows({
    sql,
    query,
    map: ({ avg_time, ...params }) => ({
      ...params,
      avg_time: formatTime(avg_time),
    }),
  });
};

exports.getIncidenceStatsForUser = async function (id, { startDate, endDate }) {
  /** @type {[Date, Date]}  */
  const dateRange = [
    moment(startDate).toDate(),
    moment(endDate).endOf('day').toDate(),
  ];

  const result = await incidencesStats()
    .select('gf_contracts.service')
    .innerJoin(contracts(), {
      'gf_contracts.id': 'gf_incidences.contractId',
    })
    .where({
      'gf_incidences.userId': id,
    })
    .whereBetween('gf_incidences.creationDate', dateRange)
    .groupBy('gf_contracts.service')
    .orderBy('total', 'desc');

  const total = result.reduce((t, i) => t + i.total, 0);
  const closed_total = result.reduce((t, i) => t + i.closed_total, 0);
  const avg =
    result.reduce((t, i) => t + i.closed_total * Number(i.avg_time), 0) /
    closed_total;

  return respondSuccess({
    summary: {
      total,
      closed_total,
      avg_time: formatTime(avg),
    },
    incidences: result.map(({ avg_time, ...params }) => ({
      ...params,
      avg_time: formatTime(avg_time),
    })),
  });
};
