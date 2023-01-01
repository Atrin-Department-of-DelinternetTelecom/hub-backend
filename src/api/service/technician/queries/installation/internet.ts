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
  globalUserId,
}: {
  userId: number;
  startDate: Date;
  endDate: Date;
  globalUserId: number; // id of global_users table, used to filter tasks by user
}) => {
  return knex('gf_contract_data_internet')
    .select(
      r("'installation' as type"),
      'gf_contracts.service as subType',
      r("CONCAT('installation/', gf_contracts.service) as fullType"),
      'gf_contract_data_internet.id as rowId',
      'gf_contract_data_internet.contractId',
      'gf_contracts.clientId',
      'instalationDate as duoDate',
      r('IFNULL(installationDone, 0) as isDone'),
      r('IFNULL(installationDuration, 120) as expectedDurationMinutes'),
      ...getAddressWithReference('gf_contracts'),
      r('null as simIcc'),
      'gf_contract_data_internet.installatorUserId as userId',
    )
    .innerJoin(contracts(), {
      'gf_contracts.id': 'gf_contract_data_internet.contractId',
    })
    .leftJoin('installation_co_workers', function () {
      this.on(
        'installation_co_workers.gf_contract_data_internet_id',
        '=',
        'gf_contract_data_internet.id',
      ).andOn('installation_co_workers.user_id', '=', r('?', [globalUserId]));
    })
    .where((builder) => {
      builder
        .where('gf_contract_data_internet.installatorUserId', userId)
        .orWhereNotNull('installation_co_workers.user_id');
    })
    .andWhere({
      status: 1,
      uid,
    })
    .whereIn('gf_contracts.state', ['pendingSectionsReady', 'active'])
    .whereBetween('instalationDate', [startDate, endDate]);
};
