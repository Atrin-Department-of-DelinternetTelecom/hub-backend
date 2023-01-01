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
  return knex('gf_assists')
    .select(
      r("'incidence' as type"),
      r("'assistance' as subType"),
      r("'incidence/assistance' as fullType"),
      'gf_assists.id as rowId',
      'gf_assists.contractId',
      'gf_assists.clientId',
      'previsionDate as duoDate',
      'closed as isDone',
      'duration as expectedDurationMinutes',
      ...getAddressWithReference('gf_contracts'),
      r('null as simIcc'),
      'gf_users.userId as userId',
    )
    .innerJoin('gf_users', { 'gf_users.id': 'gf_assists.gfUserId' })
    .innerJoin(contracts(), {
      'gf_contracts.id': 'gf_assists.contractId',
    })
    .leftJoin('gf_assist_co_workers', function () {
      this.on('gf_assist_co_workers.gf_assist_id', '=', 'gf_assists.id').andOn(
        'gf_assist_co_workers.user_id',
        '=',
        r('?', [globalUserId]),
      );
    })
    .where((builder) => {
      builder
        .where('gf_users.userId', userId)
        .orWhereNotNull('gf_assist_co_workers.user_id');
    })
    .andWhere({
      'gf_assists.status': 1,
      'gf_assists.uid': uid,
    })
    .whereBetween('previsionDate', [startDate, endDate])
    .debug(true);
};
