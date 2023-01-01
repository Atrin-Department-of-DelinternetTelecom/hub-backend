// @ts-check
'use strict';

const knex = require('@lib/knex').intranet;

exports.switchCase = (cases, { as }) => {
  const tokens = ['CASE'];

  for (const [key, value] of Object.entries(cases)) {
    if (key === 'default') {
      tokens.push(`ELSE '${value}'`);
      continue;
    }
    tokens.push(`WHEN ${key} THEN '${value}'`);
  }

  tokens.push('END', 'as', as);

  return knex.raw(tokens.join(' '));
};

/**
 *
 * @param {string[]} cols
 * @param {{ as: string }} param1
 * @returns
 */
exports.coalesce = (cols, { as }) =>
  knex.raw(`COALESCE(${cols.join(',')}) as ${as}`);

/**
 *
 * @param {string} col
 * @param {{ as: string }} param1
 * @returns
 */
exports.castInt = (col, { as } = { as: col }) =>
  knex.raw(`CAST(${col} as UNSIGNED) as ${as}`);

/**
 *
 * @param {string} column
 * @param {'=' | '>' | '<' | 'in'} condition
 * @param {any} value
 * @param {{ as: string }} param3
 * @returns
 */
exports.countIf = (column, condition, value, { as } = { as: value }) => {
  if (condition === 'in') {
    return knex.raw(`COUNT(IF(${column} in (?),1,null)) as ${as}`, value);
  }
  return knex.raw(`COUNT(IF(${column} ${condition} ?,1,null)) as ${as}`, value);
};
