// @ts-check
'use strict';

const knex = require('@lib/knex').intranet;
const config = require('@config');
const { countIf } = require('@utils/knex');

const avg_time = knex.raw(
  'AVG((TIMESTAMPDIFF(HOUR, gf_incidences.creationDate, gf_incidences.executedDate) / 24)) as avg_time',
);

const incidencesStatPerUser = () =>
  knex('gf_incidences')
    .select(
      'gf_incidences.userId',
      countIf('gf_incidences.closed', '=', 1, { as: 'closed_total' }),
      avg_time,
    )
    .count('*', { as: 'total' })
    .groupBy('gf_incidences.userId')
    .as('incidences_stat');

module.exports = {
  avg_time,
  incidencesStatPerUser,
};
