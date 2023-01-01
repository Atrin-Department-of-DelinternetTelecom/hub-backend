// @ts-check
'use strict';

const knex = require('@lib/knex').intranet;
const moment = require('moment');
const config = require('@config');
const { getAllRows } = require('@utils/knex/table');

exports.getTaskTypesStats = async function (query) {
  const { startDate: _startDate, endDate: _endDate } = query;
  const startDate = _startDate ? moment(_startDate) : moment(0);
  const endDate = _endDate ? moment(_endDate) : moment();

  /** @type {[string, string]} */
  const dateRange = [
    startDate.format('YYYY-MM-DD'),
    endDate.format('YYYY-MM-DD'),
  ];

  const sql = knex('crm_task_types')
    .select(
      'crm_task_types.id',
      'crm_task_types.name',
      'crm_task_types.creationDate',
      knex('crm_tasks')
        .count('*')
        .where({
          'crm_tasks.taskTypeId': knex.ref('crm_task_types.id'),
          'crm_tasks.status': 1,
        })
        .whereBetween('crm_tasks.creationDate', dateRange)
        .as('count'),

      knex('crm_tasks')
        .count('*')
        .where({
          'crm_tasks.status': 1,
        })
        .whereBetween('crm_tasks.creationDate', dateRange)
        .as('total'),

      knex('crm_tasks')
        .select('moozaic_users.name')
        .innerJoin('moozaic.moozaic_users', {
          'moozaic_users.id': 'crm_tasks.userId',
        })
        .where({
          'crm_tasks.taskTypeId': knex.ref('crm_task_types.id'),
          'crm_tasks.status': 1,
        })
        .orderBy('crm_tasks.creationDate', 'asc')
        .limit(1)
        .as('creator_name'),

      knex('crm_tasks')
        .min('creationDate')
        .where({
          'crm_tasks.taskTypeId': knex.ref('crm_task_types.id'),
          'crm_tasks.status': 1,
        })
        .as('first_usage_date'),

      knex('crm_tasks')
        .max('creationDate')
        .where({
          'crm_tasks.taskTypeId': knex.ref('crm_task_types.id'),
          'crm_tasks.status': 1,
        })
        .as('last_usage_date'),
    )
    .where({
      'crm_task_types.status': 1,
    })
    .whereIn('crm_task_types.uid', [-1, config.get('index.intranet.uid')]);

  return getAllRows({
    sql,
    query,
    map: ({ id, count, total, ...rest }) => ({
      id,
      percent: (100 * (count / total)).toFixed(2),
      count,
      total,
      ...rest,
    }),
  });
};

exports.getSellerTaskTypesStats = async function (id, query) {
  const { startDate, endDate } = query;

  /** @type {[string, string]} */
  const dateRange = [
    moment(startDate).format('YYYY-MM-DD'),
    moment(endDate).format('YYYY-MM-DD'),
  ];

  const sql = knex('crm_tasks')
    .select(
      'crm_task_types.id',
      'crm_task_types.name',
      'crm_task_types.color',
      'crm_task_types.icon',
    )
    .innerJoin('crm_task_types', {
      'crm_task_types.id': 'crm_tasks.taskTypeId',
    })
    .count('*', { as: 'count' })
    .where({
      'crm_tasks.userId': id,
      'crm_tasks.status': 1,
    })
    .whereBetween('crm_tasks.creationDate', dateRange)
    .groupBy('crm_tasks.taskTypeId')
    .orderBy('count', 'desc');

  return getAllRows({
    sql,
    query,
  });
};
