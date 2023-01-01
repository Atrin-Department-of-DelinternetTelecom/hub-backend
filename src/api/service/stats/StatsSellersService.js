// @ts-check
'use strict';

const knex = require('@lib/knex').intranet;
const {
  respondSuccess,
  respondSuccessWithPagination,
  respondNotFound,
} = require('@utils/response');
const moment = require('moment');
const config = require('@config');
const { knexUsers, kUserIdRef } = require('./utils');
const { getPinnedUsers } = require('./StatsPinUserService');
const { associateBy } = require('@utils/collections');
const _ = require('lodash');
const { findAllRows, getAllRows } = require('@utils/knex/table');
const { contracts } = require('./subqueries/contracts');
const { countIf } = require('@utils/knex');
const { userDocumentStats } = require('./StatsDocumentsService');

const {
  intranet: { GfIncidence, CrTask },
} = require('@models');
const { errors } = require('@api/http/http_errors');

const validStates = ['active', 'pendingSectionsReady'];

/**
 *
 * @param {string | undefined} _dateColumn
 */
const dateColumnNameFormat = (_dateColumn) => {
  const dateColumn = _dateColumn ?? 'creationDate';
  if (!['creationDate', 'dateActivation'].includes(dateColumn)) {
    throw new errors.BadRequest('Invalid date column value');
  }
  return dateColumn;
};

/**
 *
 * @param {any} query
 * @returns
 */
exports.getSellersStats = async function (query) {
  const {
    startDate: _startDate,
    endDate: _endDate,
    size,
    page,
    url,
    dateColumn: _dateColumn,
  } = query;

  const startDate = _startDate ? moment(_startDate) : moment(0);
  const endDate = _endDate ? moment(_endDate) : moment();
  const dateColumn = dateColumnNameFormat(_dateColumn);

  /**@type {[string, string]} */
  const dateRange = [
    startDate.format('YYYY-MM-DD'),
    endDate.format('YYYY-MM-DD'),
  ];

  const pinned = await getPinnedUsers('sellers');

  const sql = knexUsers({ pinned })
    .select(
      knex('gf_contracts')
        .count('*', { as: 'count' })
        .where({
          'gf_contracts.uid': config.get('index.intranet.uid'),
          'gf_contracts.status': 1,
          'gf_contracts.userId': kUserIdRef,
        })
        .whereIn('gf_contracts.state', validStates)
        .whereBetween(`gf_contracts.${dateColumn}`, dateRange)
        .as('count'),
    )
    .having('count', '>', 0)
    .orderBy('count', 'desc');

  const [sellers, sellersCount] = await findAllRows({ sql, query });
  const sellersMap = associateBy(sellers, (e) => e.userId);

  const contractsStats = await knex('gf_contracts')
    .innerJoin('gf_fee_groups', {
      'gf_contracts.feeGroupId': 'gf_fee_groups.id',
    })
    .innerJoin('gf_feegroups_sections_xref', {
      'gf_feegroups_sections_xref.feeGroupId': 'gf_fee_groups.id',
    })
    .innerJoin('gf_sections', {
      'gf_sections.id': 'gf_feegroups_sections_xref.sectionId',
    })
    .where({
      'gf_contracts.uid': config.get('index.intranet.uid'),
      'gf_sections.uid': config.get('index.intranet.uid'),
      'gf_contracts.status': 1,
      'gf_fee_groups.status': 1,
      'gf_feegroups_sections_xref.status': 1,
    })
    .whereIn(
      'gf_contracts.userId',
      sellers.map((v) => v.userId),
    )
    .whereBetween(`gf_contracts.${dateColumn}`, dateRange)
    .whereIn('gf_contracts.state', validStates)
    .groupBy('code', 'state', 'gf_contracts.userId')
    .select('code', 'state', 'gf_contracts.userId as userId')
    .count('gf_contracts.id', { as: 'count' });

  const contractsByUser = _.groupBy(contractsStats, 'userId');

  for (const [userId, contracts] of Object.entries(contractsByUser)) {
    const seller = sellersMap[userId];

    seller.data = {};

    for (const code of ['internet', 'fix', 'cell', 'tv']) {
      seller.data[code] = {};
      for (const state of ['active', 'pendingSectionsReady']) {
        seller.data[code][state] =
          _.find(contracts, {
            code: code.toUpperCase(),
            state,
          })?.count ?? 0;
      }
    }
  }

  return respondSuccessWithPagination(sellers, sellersCount, size, page, url);
};

/**
 *
 * @param {number} id
 * @returns
 */
exports.getSellerInfo = async function (id) {
  const user = await knexUsers().where({ 'moozaic_users.id': id }).first();

  if (!user) return respondNotFound('User not found');

  const first_contract = await contracts()
    .min('dateActivation', { as: 'date' })
    .where('dateActivation', '>', moment(0).toDate())
    .where({
      'gf_contracts.userId': id,
    })
    .first();

  const last_contract = await contracts()
    .max('dateActivation', { as: 'date' })
    .where({
      'gf_contracts.userId': id,
    })
    .first();

  return respondSuccess({
    ...user,
    first_contract_date: first_contract?.date,
    last_contract_date: last_contract?.date,
  });
};

/**
 *
 * @param {number} id
 * @param {{
 *   startDate: string;
 *   endDate: string;
 *   dateColumn?: string;
 * }} param1
 * @returns
 */
exports.getSellerSellsStats = async function (
  id,
  { startDate, endDate, dateColumn: _dateColumn },
) {
  /**@type {[string, string]} */
  const dateRange = [
    moment(startDate).format('YYYY-MM-DD'),
    moment(endDate).format('YYYY-MM-DD'),
  ];
  const dateColumn = dateColumnNameFormat(_dateColumn);

  const table = contracts()
    .where({
      'gf_contracts.userId': id,
    })
    .whereBetween(`gf_contracts.${dateColumn}`, dateRange)
    .as('seller_contracts');

  const contractsData = await knex
    .queryBuilder()
    .from(table)
    .select(
      'service',
      knex.raw(`COUNT(IF(state in ('active','blocked'),1,null)) as active`),
      countIf('state', '=', 'pendingSectionsReady', { as: 'pending' }),
      countIf('state', '=', 'suspended'),
    )
    .count('*', { as: 'count' })
    .sum('baseQuote', { as: 'sum_base_quote' })
    .groupBy('service')
    .orderBy('count', 'desc');

  const clientsData = await userDocumentStats(id, dateRange);

  return respondSuccess({
    clients: clientsData,
    contracts: contractsData,
  });
};

/**
 *
 * @param {{
 *   startDate: string;
 *   endDate: string;
 *   dateColumn?: string;
 * }} param0
 * @returns
 */
exports.getTotalStats = async function ({
  startDate: _startDate,
  endDate: _endDate,
  dateColumn: _dateColumn,
}) {
  const startDate = _startDate ? moment(_startDate) : moment(0);
  const endDate = _endDate ? moment(_endDate) : moment();
  const dateColumn = dateColumnNameFormat(_dateColumn);

  const rows = await knex('gf_contracts')
    .select('code')
    .count('gf_contracts.id', { as: 'count' })
    .innerJoin('gf_fee_groups', {
      'gf_contracts.feeGroupId': 'gf_fee_groups.id',
    })
    .innerJoin('gf_feegroups_sections_xref', {
      'gf_feegroups_sections_xref.feeGroupId': 'gf_fee_groups.id',
    })
    .innerJoin('gf_sections', {
      'gf_sections.id': 'gf_feegroups_sections_xref.sectionId',
    })
    .where({
      'gf_contracts.uid': config.get('index.intranet.uid'),
      'gf_sections.uid': config.get('index.intranet.uid'),
      'gf_contracts.status': 1,
      'gf_fee_groups.status': 1,
      'gf_feegroups_sections_xref.status': 1,
    })
    .whereIn('gf_contracts.state', validStates)
    .whereBetween(`gf_contracts.${dateColumn}`, [
      startDate.format('YYYY-MM-DD'),
      endDate.format('YYYY-MM-DD'),
    ])
    .groupBy('code');

  const result = rows.reduce((acc, value) => {
    acc[value.code.toLowerCase()] = value.count;
    return acc;
  }, {});

  return respondSuccess(result);
};

/**
 *
 * @param {number} id sellerId
 * @param {*} param1
 */
exports.getContractsSoldBySeller = async function (
  id,
  { startDate, endDate, dateColumn: _dateColumn, ...query },
) {
  /**@type {[string, string]} */
  const dateRange = [
    moment(startDate).format('YYYY-MM-DD'),
    moment(endDate).format('YYYY-MM-DD'),
  ];

  const dateColumn = dateColumnNameFormat(_dateColumn);

  const sql = contracts()
    .select('gf_clients.name as clientName')
    .leftJoin('gf_clients', {
      'gf_contracts.clientId': 'gf_clients.id',
    })
    .where({
      'gf_contracts.userId': id,
      'gf_contracts.status': 1,
      'gf_contracts.uid': config.get('index.intranet.uid'),
    })
    .whereBetween(`gf_contracts.${dateColumn}`, dateRange);

  return getAllRows({
    sql,
    query,
  });
};

/**
 *
 * @param {number} id sellerId
 * @param {*} param1
 */
exports.getTotalContractBaseQuoteSoldBySeller = async function (
  id,
  { startDate, endDate, dateColumn: _dateColumn },
) {
  /**@type {[string, string]} */
  const dateRange = [
    moment(startDate).format('YYYY-MM-DD'),
    moment(endDate).format('YYYY-MM-DD'),
  ];

  const dateColumn = dateColumnNameFormat(_dateColumn);

  const { baseQuote } = await contracts()
    .clearSelect()
    .sum('gf_fees.baseQuote', { as: 'baseQuote' })
    .where({
      'gf_contracts.userId': id,
      'gf_contracts.status': 1,
      'gf_contracts.uid': config.get('index.intranet.uid'),
    })
    .whereBetween(`gf_contracts.${dateColumn}`, dateRange)
    .first();

  return { baseQuote };
};

/**
 *
 * @param {number} id sellerId
 * @param {*} param1
 */
exports.getClientsSoldBySeller = async function (
  id,
  { startDate, endDate, dateColumn: _dateColumn, ...query },
) {
  /**@type {[string, string]} */
  const dateRange = [
    moment(startDate).format('YYYY-MM-DD'),
    moment(endDate).format('YYYY-MM-DD'),
  ];

  const dateColumn = dateColumnNameFormat(_dateColumn);

  const sql = knex('gf_contracts')
    .select(
      'gf_clients.id',
      'gf_clients.name',
      'gf_contracts.creationDate as contractCreationDate',
      'gf_contracts.dateActivation as contractActivationDate',
    )
    .leftJoin('gf_clients', {
      'gf_contracts.clientId': 'gf_clients.id',
    })
    .where({
      'gf_contracts.userId': id,
      'gf_contracts.status': 1,
      'gf_contracts.uid': config.get('index.intranet.uid'),
    })
    .whereBetween(`gf_contracts.${dateColumn}`, dateRange)
    .groupBy('gf_clients.id');

  return getAllRows({
    sql,
    query,
  });
};

const sellerContractsQuery = (userId) => {
  return knex
    .select('code')
    .select(knex.raw('COUNT(gf_contracts.id) * IFNULL(point, 1) as points'))
    .select(knex.raw('COUNT(gf_contracts.id) as count'))
    .from('intranet.gf_contracts')
    .leftJoin(
      knex.raw(
        '(SELECT code, feeGroupId FROM intranet.gf_feegroups_sections_xref RIGHT JOIN intranet.gf_sections ON gf_sections.id = gf_feegroups_sections_xref.sectionId) AS derived_table',
      ),
      'derived_table.feeGroupId',
      'gf_contracts.feeGroupId',
    )
    .leftJoin(
      'delinternet_hub.seller_competition_points',
      'seller_competition_points.item',
      'gf_contracts.feeGroupId',
    )
    .where('gf_contracts.sellerId', userId)
    .where('gf_contracts.status', 1)
    .where('gf_contracts.uid', 90)
    .where('state', 'active')
    .whereNotNull('dateActivation')
    .andWhere(function () {
      this.whereNotNull('seller_competition_points.group')
        .andWhere('seller_competition_points.group', 'fee')
        .orWhereNull('seller_competition_points.group')
        .andWhereRaw('IFNULL(seller_competition_points.group, ?) = ?', [
          'fee',
          'fee',
        ]);
    });
};

exports.getSellerPoints = async (userId) => {
  const result = await sellerContractsQuery(userId).groupByRaw(
    'code, gf_contracts.feeGroupId',
  );
  /**@type {Record<string, number>} */
  const defaults = {
    count: 0,
    points: 0,
  };
  /**@type {Record<string, object>} */
  const stats = {
    INTERNET: { ...defaults },
    TV: { ...defaults },
    CELL: { ...defaults },
    FIX: { ...defaults },
    TOTAL: { ...defaults },
    INCIDENCE: {
      count: await GfIncidence.count({ where: { userId } }),
      points: 0,
    },
    EVENT: {
      count: await CrTask.count({ where: { userId } }),
      points: 0,
    },
  };

  result.forEach(({ code, points, count }) => {
    if (stats[code] !== undefined) {
      stats[code].count += count;
      stats[code].points += points;
      stats.TOTAL.points += points;
      stats.TOTAL.count += count;
    }
  });

  return respondSuccess(stats);
};

exports.getSellerPointsChart = async (userId, { startDate, endDate, step }) => {
  step = step ?? 'month';
  endDate = endDate ? moment(endDate) : moment();
  const steps = {
    year: '%Y',
    month: '%Y-%m',
    week: '%Y-%U',
    day: '%Y-%m-%d',
  };

  /**@type {Record<string, number | object[]>} */
  const defaults = {
    count: 0,
    points: 0,
    stats: {
      count: 0,
      points: 0,
    },
  };
  /**@type {Record<string, object>} */
  const stats = {
    INTERNET: { ...defaults },
    TV: { ...defaults },
    CELL: { ...defaults },
    FIX: { ...defaults },
    INCIDENCE: { ...defaults },
    EVENT: { ...defaults },
  };

  const accumulated = {
    INTERNET: {},
    TV: {},
    CELL: {},
    FIX: {},
  };

  const result = await sellerContractsQuery(userId)
    .select(knex.raw('DATE_FORMAT(dateActivation, ?) AS date', steps[step]))
    .whereBetween('dateActivation', [
      moment(startDate).toDate(),
      endDate.toDate(),
    ])
    .groupByRaw('date, gf_contracts.feeGroupId');

  result.forEach(({ date, code, points, count }) => {
    if (stats[code] !== undefined) {
      stats[code].count += count;
      stats[code].points += points;
      accumulated[code][date] = {
        count: (accumulated[code]?.[date]?.count ?? 0) + count,
        points: (accumulated[code]?.[date]?.points ?? 0) + points,
        date: date,
        year: moment(date).format('YYYY'),
        month: moment(date).format('MMM'),
        day: moment(date).format('Do'),
        week: moment(date).format('w'),
      };
    }
  });

  stats.INTERNET.stats = Object.values(accumulated.INTERNET);
  stats.TV.stats = Object.values(accumulated.TV);
  stats.CELL.stats = Object.values(accumulated.CELL);
  stats.FIX.stats = Object.values(accumulated.FIX);

  stats.EVENT = generateRecordStats(
    await countInDateRecordsForSeller('intranet.crm_tasks', {
      userId,
      startDate,
      endDate,
      step: steps[step],
    }),
  );
  stats.INCIDENCE = generateRecordStats(
    await countInDateRecordsForSeller('intranet.gf_incidences', {
      userId,
      startDate,
      endDate,
      step: steps[step],
    }),
  );

  return respondSuccess(stats);
};

const countInDateRecordsForSeller = async (
  table,
  { userId, step, startDate, endDate },
) => {
  return knex(table)
    .select(knex.raw('COUNT(id) as count'))
    .select(knex.raw('DATE_FORMAT(creationDate, ?) AS date', step))
    .where('status', 1)
    .andWhere('uid', 90)
    .andWhere('userId', userId)
    .whereBetween('creationDate', [
      moment(startDate).toDate(),
      endDate.toDate(),
    ])
    .groupByRaw('date');
};

const generateRecordStats = (records) => {
  const sum = records.reduce((sum, { count }) => sum + count, 0);
  return {
    count: sum,
    points: sum,
    stats: records.map(({ date, count }) => {
      return {
        count: count,
        points: count,
        date: date,
        year: moment(date).format('YYYY'),
        month: moment(date).format('MMM'),
        day: moment(date).format('Do'),
        week: moment(date).format('w'),
      };
    }),
  };
};
