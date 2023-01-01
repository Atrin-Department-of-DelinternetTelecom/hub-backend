'use strict';

const qs = require('qs');
const { respondSuccessWithPagination } = require('@utils/response');
const _ = require('lodash');
const { fields } = require('@lib/search-builder/config');
const { writeFileSync } = require('fs-extra');
const intranetKnex = require('@lib/knex').intranet;
const debug = require('debug')('knex:table');

const rawKey = (key, knex) => knex.raw('`' + key + '`');
const extractNestedColumns = (row) => {
  const r = {};
  for (const key in row) {
    _.set(r, key, row[key]);
  }
  return r;
};

/**
 *
 * @param {{
 *  sql: import("knex").Knex.QueryBuilder,
 *  query: any,
 *  nested?: boolean
 *  knex?: import("knex").Knex,
 *  paginateOn?: string[]
 *  scopes?: Record<string, (qb: import('knex').Knex.QueryBuilder, value: any) => Promise<void>| void>
 * }} param0
 * paginateOn is useful for pagination in case one to many queries
 * @returns {Promise<[any[], number]>}
 */
exports.findAllRows = async ({
  query,
  sql: tableQuery,
  nested,
  knex: _knex,
  paginateOn = undefined,
  scopes,
}) => {
  const knex = _knex ?? intranetKnex;
  const { limit, offset } = query;
  debug(tableQuery.toSQL().toNative().sql);

  const sql = knex.queryBuilder().from(tableQuery.clone().as('query'));

  if (query.filter) {
    const { filter } = qs.parse(query.filter, {
      ignoreQueryPrefix: true,
      strictNullHandling: true,
    });

    for (const [_key, value] of Object.entries(filter ?? {})) {
      if (typeof scopes?.[_key] === 'function') {
        await scopes[_key](sql, value);
        continue;
      }

      const key = rawKey(_key, knex);

      if (value?.like) {
        sql.whereILike(key, value.like);
        continue;
      }

      if (value?.between) {
        sql.whereBetween(key, value?.between);
        continue;
      }

      if (value === 'null') {
        sql.whereNull(key);
        continue;
      }

      sql.where(key, '=', value);
    }
  }

  if (query.order) {
    const { order } = qs.parse(query.order, {
      ignoreQueryPrefix: true,
      strictNullHandling: true,
    });
    for (const [key, value] of Object.entries(order ?? {})) {
      sql.orderBy(key, value);
    }
  }

  let rows = [];
  let count = 0;
  if (paginateOn?.length) {
    count = (
      await sql.clone().countDistinct({
        count: paginateOn.map((column) =>
          knex.raw(`COALESCE(??, 0)`, [column]),
        ),
      })
    )[0].count;
    const mainEntities = await sql
      .clone()
      .groupBy(paginateOn)
      .limit(limit)
      .offset(offset);

    sql.where(function () {
      mainEntities.forEach((filter) => {
        this.orWhere(function () {
          paginateOn.forEach((column) => {
            this.andWhere(column, filter[column]);
          });
        });
      });
    });
    rows = await sql.clone();
  } else {
    count = (await sql.clone().count('*', { as: 'count' }))[0].count;
    rows = await sql.clone().limit(limit).offset(offset);
  }

  if (nested) {
    rows = rows.map(extractNestedColumns);
  }

  return [rows, count];
};
/**
 *
 * @param {{
 *  sql: import("knex").Knex.QueryBuilder,
 *  query: any,
 *  nested?: boolean,
 *  map? (data: any) => any,
 *  reduce? (data: any, acc: any) => any,
 *  paginateOn? string[],
 *  knex?: any,
 *  scopes?: Record<string, (qb: import('knex').Knex.QueryBuilder, value: any) => Promise<void>| void>
 * }} param0
 *
 * @returns {Promise<import('@utils/response').ResponsePayload>}
 */
exports.getAllRows = async ({
  query,
  sql,
  nested,
  knex,
  paginateOn,
  scopes,
  reduce,
  map,
}) => {
  const { size, page, url } = query;

  // eslint-disable-next-line prefer-const
  let [rows, count] = await exports.findAllRows({
    query,
    sql,
    nested,
    knex,
    paginateOn,
    scopes,
  });

  if (map) {
    rows = rows.map(map);
  }

  if (reduce) {
    rows = rows.reduce(reduce, {});
    rows = Object.values(rows);
  }

  return respondSuccessWithPagination(rows, count, size, page, url);
};
