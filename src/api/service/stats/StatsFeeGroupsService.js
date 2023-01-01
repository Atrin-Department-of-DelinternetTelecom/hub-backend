// @ts-check
'use strict';

const knex = require('@lib/knex').intranet;
const moment = require('moment');
const config = require('@config');
const { getAllRows } = require('@utils/knex/table');
const { respondSuccess } = require('@utils/response');

exports.feeGroupsSummary = async function (query) {
  const { startDate: _startDate, endDate: _endDate } = query;
  const startDate = _startDate ? moment(_startDate) : moment(0);
  const endDate = _endDate ? moment(_endDate) : moment();

  const feeGroupsStat = await knex('gf_contracts')
    .select('gf_contracts.state')
    .count('*', { as: 'count' })
    .where({
      'gf_contracts.uid': config.get('index.intranet.uid'),
      'gf_contracts.status': 1,
    })
    .whereBetween('gf_contracts.creationDate', [
      startDate.format('YYYY-MM-DD'),
      endDate.format('YYYY-MM-DD'),
    ])
    .groupBy('gf_contracts.state');

  const result = Object.fromEntries(
    feeGroupsStat.map(({ state, count }) => [state, count]),
  );

  const total = feeGroupsStat.reduce((acc, e) => acc + e.count, 0);

  return respondSuccess({
    ...result,
    total,
  });
};

const feeGroupUsedBetweenDates = async (startDate, endDate) => {
  const sql = knex('gf_contracts')
    .where({
      'gf_contracts.uid': config.get('index.intranet.uid'),
      'gf_contracts.status': 1,
    })
    .whereBetween('gf_contracts.creationDate', [
      startDate.format('YYYY-MM-DD'),
      endDate.format('YYYY-MM-DD'),
    ])
    .groupBy('feeGroupId');

  const feeGroupIds = (await sql.clone()).map(
    (contract) => contract.feeGroupId,
  );

  return feeGroupIds;
};

exports.getFeeGroups = async function (query) {
  const { startDate: _startDate, endDate: _endDate, user_id } = query;
  const startDate = _startDate ? moment(_startDate) : moment(0);
  const endDate = _endDate ? moment(_endDate) : moment();

  const feeGroupIds = await feeGroupUsedBetweenDates(startDate, endDate);

  const contractsCount = (state) => {
    const sql = knex('gf_contracts')
      .count('*')
      .where({
        'gf_contracts.uid': config.get('index.intranet.uid'),
        'gf_contracts.feeGroupId': knex.ref('gf_fee_groups.id'),
        'gf_contracts.status': 1,
      })
      .whereBetween('gf_contracts.creationDate', [
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD'),
      ]);

    if (state) {
      sql.where('gf_contracts.state', '=', state);
    }

    if (user_id) {
      sql.where({
        'gf_contracts.userId': user_id,
      });
    }

    return sql;
  };

  const sql = knex('gf_fee_groups')
    .select(
      'gf_fee_groups.id',
      'gf_fee_groups.name',
      'gf_sections.code',
      contractsCount('active').as('active_count'),
      contractsCount('pendingSectionsReady').as('pending_count'),
      contractsCount('suspended').as('suspended_count'),
      contractsCount('blocked').as('blocked_count'),
      contractsCount().as('total'),
    )
    .innerJoin('gf_feegroups_sections_xref', {
      'gf_feegroups_sections_xref.feeGroupId': 'gf_fee_groups.id',
    })
    .innerJoin('gf_sections', {
      'gf_sections.id': 'gf_feegroups_sections_xref.sectionId',
    })
    .where({
      'gf_fee_groups.uid': config.get('index.intranet.uid'),
      'gf_sections.uid': config.get('index.intranet.uid'),
      'gf_feegroups_sections_xref.status': 1,
    })
    .whereIn('gf_fee_groups.id', feeGroupIds)
    .having('total', '>', 0);

  return getAllRows({ sql, query });
};
