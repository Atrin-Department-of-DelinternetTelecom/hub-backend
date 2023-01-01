// ts-check
'use strict';

const knex = require('@lib/knex').intranet;
const config = require('@config');
const { getAllRows } = require('@utils/knex/table');

const level = (percent) => {
  if (percent < 10) return 'low';
  if (percent < 40) return 'medium';
  return 'high';
};

exports.getCoverageStats = async function (query) {
  const { service } = query;
  const r = (s) => knex.raw(s);

  const fees = knex('gf_fees')
    .groupBy('gf_fees.feeGroupId')
    .where({ 'gf_fees.status': 1 })
    .as('gf_fees');

  const contracts = knex('gf_contracts')
    .count('*', { as: 'total' })
    .select(
      knex.raw(
        'COALESCE(gf_contract_data_internet.addressCityCode, gf_clients.addressCityCode) AS addressCityCode',
      ),
    )
    .innerJoin('gf_contract_data_internet', {
      'gf_contract_data_internet.contractId': 'gf_contracts.id',
    })
    .innerJoin('gf_clients', {
      'gf_clients.id': 'gf_contracts.clientId',
    })
    .innerJoin(fees, {
      'gf_fees.feeGroupId': 'gf_contracts.feeGroupId',
    })
    .where({
      'gf_contracts.status': 1,
      'gf_contracts.state': 'active',
      'gf_contracts.uid': config.get('index.intranet.uid'),
      'gf_fees.internetTechnology': service,
    })
    .groupBy('addressCityCode')
    .as('gf_contracts');

  const cities = knex('delstats.cities').groupBy('code').as('cities');

  const sql = knex
    .queryBuilder()
    .from(contracts)
    .select(
      'total',
      'cities.city',
      'cities.province',
      'habitants.habitants',
      'addressCityCode',
      r('habitants.habitants / 2.5 as ui'),
      r('((total * 100) / (habitants.habitants / 2.5)) as percent'),
    )

    .innerJoin(cities, {
      'cities.code': knex.ref('addressCityCode'),
    })
    .innerJoin(
      'delstats.habitants',
      'habitants.ine_code',
      '=',
      r('CONCAT(cities.ine_province_code, cities.ine_code)'),
    );

  return getAllRows({
    query,
    sql,
    map: (row) => ({
      ...row,
      level: level(Number(row.percent)),
    }),
  });
};
