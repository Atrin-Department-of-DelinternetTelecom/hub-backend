// @ts-check
'use strict';

const knex = require('@lib/knex').intranet;
const config = require('@config');
const { getAllRows } = require('@utils/knex/table');

exports.getClients = async function (query) {
  const sql = knex('gf_clients')
    .select(
      'gf_clients.id',
      'gf_clients.name',
      'gf_clients.active',
      'gf_clients.creationDate',
      'gf_clients.updateDate',
      knex.raw('NULLIF(iban, "") as iban'),
      knex.raw('((iban is not null) and (iban != "")) as has_iban'),
      knex.raw('IFNULL(noBillable, 0) as noBillable'),
      knex('gf_contracts')
        .count('*')
        .where({
          'gf_contracts.status': 1,
          'gf_contracts.state': 'active',
          'gf_contracts.clientId': knex.ref('gf_clients.id'),
        })
        .as('contracts_count'),
    )
    .where({
      'gf_clients.uid': config.get('index.intranet.uid'),
      'gf_clients.status': 1,
    });

  return getAllRows({ sql, query });
};
