// @ts-check
'use strict';

const knex = require('@lib/knex').intranet;
const config = require('@config');

const fees = knex('gf_fees')
  .groupBy('gf_fees.feeGroupId')
  .where({ 'gf_fees.status': 1 })
  .as('gf_fees');

exports.contracts = () =>
  knex('gf_contracts')
    .select(
      'gf_contracts.id',
      'gf_contracts.clientId',
      'gf_contracts.state',
      'gf_contracts.dateActivation',
      'gf_contracts.dateDeactivation',
      'gf_contracts.creationDate',
      'gf_fees.baseQuote',
      knex.raw(
        'IF(gf_fees.internetTechnology, gf_fees.internetTechnology, LOWER(gf_sections.code)) as service',
      ),
    )
    .innerJoin('gf_fee_groups', {
      'gf_contracts.feeGroupId': 'gf_fee_groups.id',
    })
    .innerJoin('gf_feegroups_sections_xref', {
      'gf_feegroups_sections_xref.feeGroupId': 'gf_fee_groups.id',
    })
    .innerJoin('gf_sections', {
      'gf_sections.id': 'gf_feegroups_sections_xref.sectionId',
    })
    .innerJoin(fees, { 'gf_fee_groups.id': 'gf_fees.feeGroupId' })
    .where({
      'gf_contracts.uid': config.get('index.intranet.uid'),
      'gf_contracts.status': 1,
      'gf_fee_groups.status': 1,
      'gf_feegroups_sections_xref.status': 1,
    })
    .as('gf_contracts');
