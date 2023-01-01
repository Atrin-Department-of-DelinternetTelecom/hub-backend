// @ts-check
'use strict';

const { getAllRows } = require('@utils/knex/table');
const knex = require('@lib/knex').intranet;
const config = require('@config');
const _ = require('lodash');
const { respondSuccess } = require('@utils/response');
const moment = require('moment');
const { switchCase, countIf } = require('@utils/knex');

const uid = config.get('index.intranet.uid');

const activeClientIds = () => {
  const startOfCurrentMonth = moment().startOf('month').format('YYYY-MM-DD');
  const startOfLastMonth = moment()
    .subtract(1, 'month')
    .startOf('month')
    .format('YYYY-MM-DD');

  return knex('gf_contracts')
    .select('gf_contracts.clientId')
    .where({
      status: 1,
      uid,
    })
    .andWhere(function () {
      this.where('gf_contracts.state', 'active').orWhereBetween(
        'gf_contracts.dateDeactivation',
        [startOfCurrentMonth, startOfLastMonth],
      );
    });
};

const activeClients = () =>
  knex('gf_clients')
    .where({
      'gf_clients.active': 1,
      'gf_clients.status': 1,
      'gf_clients.uid': uid,
    })
    .whereIn('gf_clients.id', activeClientIds());

const oldSepas = knex('gf_client_documents').where({
  conceptId: 1,
  status: 1,
  uid,
});

const newSepas = knex('gf_docs')
  .innerJoin('docs_status', {
    typeId: 'gf_docs.id',
  })
  .where({
    'gf_docs.type': 'Goufone-Documents-Sepa',
    'gf_docs.status': 1,
    'gf_docs.uid': uid,
    'docs_status.status': 1,
    'docs_status.uid': uid,
  });

const signedNewSepas = newSepas.clone().where({
  'docs_status.signed': 1,
});

const unsignedNewSepas = newSepas.clone().where({
  'docs_status.signed': 0,
});

exports.getClientsSepaSummary = async function () {
  /**
   * @type {{
   *   has_old_sepa: 0 | 1,
   *   has_signed_new_sepa: 0 | 1,
   *   has_unsigned_new_sepa: 0 | 1,
   *   count: number,
   * }[]}
   */
  const result = await activeClients()
    .select(
      knex.raw(
        `gf_clients.id in (?) as has_old_sepa`,
        oldSepas.clone().select('clientId'),
      ),
      knex.raw(
        `gf_clients.id in (?) as has_signed_new_sepa`,
        signedNewSepas.clone().select('clientId'),
      ),
      knex.raw(
        `gf_clients.id in (?) as has_unsigned_new_sepa`,
        unsignedNewSepas.clone().select('clientId'),
      ),
    )
    .count('*', { as: 'count' })
    .groupBy('has_old_sepa', 'has_signed_new_sepa', 'has_unsigned_new_sepa');

  const total_no_sepa = _.find(result, {
    has_old_sepa: 0,
    has_signed_new_sepa: 0,
    has_unsigned_new_sepa: 0,
  })?.count;

  const total_signed_new_sepa = result
    .filter((row) => row.has_signed_new_sepa)
    .reduce((acc, row) => acc + row.count, 0);

  const total_unsigned_new_sepa = result
    .filter((row) => row.has_unsigned_new_sepa)
    .reduce((acc, row) => acc + row.count, 0);

  const total_old_sepa = _.find(result, {
    has_old_sepa: 1,
    has_signed_new_sepa: 0,
    has_unsigned_new_sepa: 0,
  })?.count;

  return respondSuccess({
    total_no_sepa,
    total_signed_new_sepa,
    total_unsigned_new_sepa,
    total_old_sepa,
  });
};

exports.getClientsSepaStats = async function (query) {
  const sql = knex
    .queryBuilder()
    .select(
      'gf_clients_stats.id',
      'gf_clients_stats.name',
      'gf_clients_stats.active',
      'gf_clients_stats.creationDate',
      'gf_clients_stats.updateDate',
      switchCase(
        {
          'has_old AND !has_signed AND !has_unsigned': 'old_sepa',
          has_signed: 'signed_new_sepa',
          has_unsigned: 'unsigned_new_sepa',
          default: 'no_sepa',
        },
        { as: 'sepa_status' },
      ),
    )
    .from(
      activeClients()
        .select(
          'gf_clients.*',
          knex.raw(
            `gf_clients.id in (?) as has_old`,
            oldSepas.clone().select('clientId'),
          ),
          knex.raw(
            `gf_clients.id in (?) as has_unsigned`,
            unsignedNewSepas.clone().select('clientId'),
          ),
          knex.raw(
            `gf_clients.id in (?) as has_signed`,
            signedNewSepas.clone().select('clientId'),
          ),
        )
        .as('gf_clients_stats'),
    );

  return getAllRows({
    query,
    sql,
  });
};

exports.userDocumentStats = async function (id, dateRange) {
  const [result] = await knex('gf_clients')
    .count('*', { as: 'total' })
    .select(
      countIf('gf_clients.id', 'in', activeClientIds(), {
        as: 'total_active',
      }),
      countIf(
        'gf_clients.id',
        'in',
        signedNewSepas.clone().select('clientId'),
        { as: 'total_signed_sepa' },
      ),
    )
    .where({
      'gf_clients.status': 1,
      'gf_clients.uid': uid,
      'gf_clients.userId': id,
    })
    .whereBetween('gf_clients.creationDate', dateRange);

  return result;
};
