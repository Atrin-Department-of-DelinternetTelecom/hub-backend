// @ts-check
'use strict';

const knex = require('@lib/knex').intranet;
const {
  respondSuccess,
  respondBadRequest,
  respondNotFound,
} = require('@utils/response');
const moment = require('moment');
const config = require('@config');
const _ = require('lodash');
const { knexUsers, kUserIdRef } = require('./utils');
const { buildChart } = require('@utils/knex/chart');
const { getAllRows } = require('@utils/knex/table');

/**
 *
 * @param {number} value
 * @param {string} message
 */
const IfNaN = (value, message) => {
  if (Number.isNaN(value)) return message ?? 'No Data';
};

const crmTaskTags = (dateRange) => {
  return knex('crm_tasks_extra_fields')
    .select(
      'crm_tasks_extra_fields.id',
      knex.raw("'crm-task' as type"),
      'crm_tasks_extra_fields.name',
      'crm_tasks_extra_fields.creationDate',
      knex('crm_tasks_extra_fields_xref')
        .select('moozaic_users.name')
        .innerJoin('crm_tasks', {
          'crm_tasks.id': 'crm_tasks_extra_fields_xref.taskId',
        })
        .innerJoin('moozaic.moozaic_users', {
          'moozaic_users.id': 'crm_tasks.userId',
        })
        .where({
          'crm_tasks_extra_fields_xref.extraFieldId': knex.ref(
            'crm_tasks_extra_fields.id',
          ),
          'crm_tasks_extra_fields_xref.status': 1,
        })
        .orderBy('crm_tasks_extra_fields_xref.creationDate')
        .limit(1)
        .as('creator_name'),

      knex('crm_tasks_extra_fields_xref')
        .count('*')
        .where({
          'crm_tasks_extra_fields_xref.extraFieldId': knex.ref(
            'crm_tasks_extra_fields.id',
          ),
          'crm_tasks_extra_fields_xref.status': 1,
        })

        .whereBetween('crm_tasks_extra_fields_xref.creationDate', dateRange)
        .as('count'),

      knex('crm_tasks_extra_fields_xref')
        .count('*')
        .where({
          'crm_tasks_extra_fields_xref.status': 1,
        })
        .whereBetween('crm_tasks_extra_fields_xref.creationDate', dateRange)
        .as('total'),

      knex('crm_tasks_extra_fields_xref')
        .min('creationDate')
        .where({
          'crm_tasks_extra_fields_xref.extraFieldId': knex.ref(
            'crm_tasks_extra_fields.id',
          ),
          'crm_tasks_extra_fields_xref.status': 1,
        })
        .as('first_usage_date'),

      knex('crm_tasks_extra_fields_xref')
        .max('creationDate')
        .where({
          'crm_tasks_extra_fields_xref.extraFieldId': knex.ref(
            'crm_tasks_extra_fields.id',
          ),
          'crm_tasks_extra_fields_xref.status': 1,
        })
        .as('last_usage_date'),
    )
    .where({
      'crm_tasks_extra_fields.uid': config.get('index.intranet.uid'),
      'crm_tasks_extra_fields.status': 1,
    });
};

const invoiceClientsTags = (dateRange) => {
  return knex('invoice_clients_extra_fields')
    .select(
      'invoice_clients_extra_fields.id',
      knex.raw("'invoice-client' as type"),
      'invoice_clients_extra_fields.name',
      'invoice_clients_extra_fields.creationDate',
      knex.raw('null as creator_name'),
      knex('invoice_clients_extra_fields_xref')
        .count('*')
        .where({
          'invoice_clients_extra_fields_xref.extraFieldId': knex.ref(
            'invoice_clients_extra_fields.id',
          ),
          'invoice_clients_extra_fields_xref.status': 1,
        })
        .whereBetween(
          'invoice_clients_extra_fields_xref.creationDate',
          dateRange,
        )
        .as('count'),

      knex('invoice_clients_extra_fields_xref')
        .count('*')
        .where({
          'invoice_clients_extra_fields_xref.status': 1,
        })
        .whereBetween(
          'invoice_clients_extra_fields_xref.creationDate',
          dateRange,
        )
        .as('total'),

      knex('invoice_clients_extra_fields_xref')
        .min('creationDate')
        .where({
          'invoice_clients_extra_fields_xref.extraFieldId': knex.ref(
            'invoice_clients_extra_fields.id',
          ),
          'invoice_clients_extra_fields_xref.status': 1,
        })
        .as('first_usage_date'),

      knex('invoice_clients_extra_fields_xref')
        .max('creationDate')
        .where({
          'invoice_clients_extra_fields_xref.extraFieldId': knex.ref(
            'invoice_clients_extra_fields.id',
          ),
          'invoice_clients_extra_fields_xref.status': 1,
        })
        .as('last_usage_date'),
    )
    .where({
      'invoice_clients_extra_fields.uid': config.get('index.intranet.uid'),
      'invoice_clients_extra_fields.status': 1,
    });
};

exports.getTagsStats = async function (query) {
  const { startDate: _startDate, endDate: _endDate } = query;
  const startDate = _startDate ? moment(_startDate) : moment(0);
  const endDate = _endDate ? moment(_endDate) : moment();

  /** @type {[string, string]} */
  const dateRange = [
    startDate.format('YYYY-MM-DD'),
    endDate.format('YYYY-MM-DD'),
  ];

  const sql = knex.union(crmTaskTags(dateRange), invoiceClientsTags(dateRange));

  return getAllRows({
    sql,
    query,
    map: ({ id, type, count, total, ...rest }) => ({
      id: type + ':' + id,
      type,
      percent: (100 * (count / total)).toFixed(2) || 'No Data',
      count,
      ...rest,
    }),
  });
};

exports.getTagStats = async function (id) {
  const [tagType, tagId] = id.split(':');

  if (tagType !== 'crm-task' && tagType !== 'invoice-client') {
    return respondBadRequest(`Invalid tag type: ${tagType}`);
  }

  /** @type {[string, string]} */
  const dateRange = ['0000-00-00', moment().format('YYYY-MM-DD')];

  const sql =
    tagType === 'crm-task'
      ? crmTaskTags(dateRange)
      : invoiceClientsTags(dateRange);

  sql.where({
    id: tagId,
  });

  const [result] = await sql;
  if (!result) {
    return respondNotFound(`Tag not found: ${id}`);
  }

  const { id: _id, type, count, total, ...rest } = result;

  return respondSuccess({
    id,
    type,
    percent: (100 * (count / total)).toFixed(2),
    count,
    ...rest,
  });
};

// DO NOT remove async from this function.
exports.getTagStatsPerUser = async function (id, query) {
  const { startDate: _startDate, endDate: _endDate } = query;
  const startDate = _startDate ? moment(_startDate) : moment(0);
  const endDate = _endDate ? moment(_endDate) : moment();

  /** @type {[string, string]} */
  const dateRange = [
    startDate.format('YYYY-MM-DD'),
    endDate.format('YYYY-MM-DD'),
  ];

  const [tagType, tagId] = id.split(':');

  if (tagType !== 'crm-task') {
    return respondBadRequest(`Invalid tag type: ${tagType}`);
  }

  const sql = knexUsers({ pinned: [] })
    .select(
      knex('crm_tasks_extra_fields_xref')
        .count('*')
        .innerJoin('crm_tasks', {
          'crm_tasks.id': 'crm_tasks_extra_fields_xref.taskId',
        })
        .where({
          'crm_tasks_extra_fields_xref.uid': config.get('index.intranet.uid'),
          'crm_tasks.userId': kUserIdRef,
          'crm_tasks_extra_fields_xref.extraFieldId': tagId,
        })
        .whereBetween('crm_tasks_extra_fields_xref.creationDate', dateRange)

        .as('count'),
    )
    .having('count', '>', 0)
    .orderBy('count', 'desc');

  return getAllRows({ sql, query });
};

const tagTypeTableMap = {
  'crm-task': 'crm_tasks_extra_fields_xref',
  'invoice-client': 'invoice_clients_extra_fields_xref',
};

exports.getTagChart = async function (
  id,
  { startDate: _startDate, endDate: _endDate, step },
) {
  const [tagType, tagId] = id.split(':');
  step = step ?? 'month';

  const startDate = moment(_startDate);
  const endDate = _endDate ? moment(_endDate) : moment();

  const table = tagTypeTableMap[tagType];
  if (!table)
    return respondBadRequest(`tagType:${tagType} is not a valid tag type`);

  const sql = knex(`${table} as xref`)
    .select(knex.raw('(select "all") as prop'))
    .select('xref.creationDate as date')

    .where({
      'xref.extraFieldId': tagId,
    });

  const chart = await buildChart({
    sql,
    keys: [],
    stepSize: step,
    startDate,
    endDate,
    dateColumn: 'xref.creationDate',
  });

  return respondSuccess(chart);
};
