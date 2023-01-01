import config from '@config';
import { contracts } from '../contracts';
import { getAddressWithReference } from '../../utils/address';
import { intranet as knex } from '@lib/knex';

const uid = config.get('index.intranet.uid');
const r = knex.raw.bind(knex);

export const query = ({
  userId,
  startDate,
  endDate,
}: {
  userId: number;
  startDate: Date;
  endDate: Date;
}) => {
  return knex('gf_sim_deliveries')
    .select(
      r("'incidence' as type"),
      r("'sim_delivery' as subType"),
      r("'incidence/sim_delivery' as fullType"),
      'gf_sim_deliveries.technicianUserId as userId',
      'gf_sim_deliveries.id as rowId',
      'gf_sim_deliveries.contractId',
      'gf_sim_deliveries.clientId',
      'gf_sim_deliveries.date as duoDate',
      'gf_sim_deliveries.closed as isDone',
      r('120 as expectedDurationMinutes'),
      ...getAddressWithReference('gf_sim_deliveries'),
      'gf_contract_data_cell.icc as simIcc',
    )
    .innerJoin(contracts(), {
      'gf_contracts.id': 'gf_sim_deliveries.contractId',
    })
    .leftJoin('gf_contract_data_cell', {
      'gf_contract_data_cell.contractId': 'gf_sim_deliveries.contractId',
    })
    .where({
      'gf_sim_deliveries.technicianUserId': userId,
      'gf_sim_deliveries.status': 1,
      'gf_contract_data_cell.status': 1,
      'gf_sim_deliveries.uid': uid,
    })
    .whereBetween('date', [startDate, endDate]);
};
