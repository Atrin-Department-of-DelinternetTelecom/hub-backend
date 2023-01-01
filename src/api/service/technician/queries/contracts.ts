import { intranet as knex } from '@lib/knex';
import config from '@config';
import {
  coalesceAddressFieldsWithTwoReference,
  getAddressWithReference,
} from '../utils/address';

const uid = config.get('index.intranet.uid');

const fees = knex('gf_fees')
  .groupBy('gf_fees.feeGroupId')
  .where({ 'gf_fees.status': 1 })
  .as('gf_fees');

const dataFixPopulated = knex('gf_contract_data_fix')
  .select(
    'gf_contract_data_fix.contractId',
    ...getAddressWithReference('gf_contract_data_internet'),
  )
  .innerJoin('gf_contract_data_internet', {
    'gf_contract_data_internet.id': 'gf_contract_data_fix.internetSectionId',
  })
  .as('data_fix_populated');

export const contracts = () =>
  knex('gf_contracts')
    .select(
      'gf_contracts.id',
      'gf_contracts.clientId',
      'gf_contracts.state',
      'gf_contracts.dateActivation',
      'gf_contracts.dateDeactivation',
      'gf_contracts.creationDate',
      knex.raw(
        'IF(gf_fees.internetTechnology, gf_fees.internetTechnology, LOWER(gf_sections.code)) as service',
      ),
      ...coalesceAddressFieldsWithTwoReference(
        'gf_contract_data_internet',
        'data_fix_populated',
        true,
      ),
    )
    .innerJoin('gf_feegroups_sections_xref', {
      'gf_feegroups_sections_xref.feeGroupId': 'gf_contracts.feeGroupId',
    })
    .innerJoin('gf_sections', {
      'gf_sections.id': 'gf_feegroups_sections_xref.sectionId',
    })
    .innerJoin(fees, { 'gf_contracts.feeGroupId': 'gf_fees.feeGroupId' })
    .leftJoin('gf_contract_data_internet', {
      'gf_contract_data_internet.contractId': 'gf_contracts.id',
    })
    .leftJoin(dataFixPopulated, {
      'data_fix_populated.contractId': 'gf_contracts.id',
    })
    .where({
      'gf_contracts.uid': uid,
      'gf_contracts.status': 1,
      'gf_feegroups_sections_xref.status': 1,
    })
    .as('gf_contracts');
