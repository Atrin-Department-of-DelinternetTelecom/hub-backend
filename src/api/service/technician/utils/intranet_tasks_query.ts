import { castInt, coalesce } from '@utils/knex';

import { coalesceAddressFieldsWithTwoReference } from './address';
import { intranet as knex } from '@lib/knex';
import { queries } from '../queries';

const r = knex.raw.bind(knex);

const technicianDoneTasks = () => {
  return knex('delinternet_hub.technician_tasks')
    .select('technician_tasks.type', 'technician_tasks.type_id')
    .select(
      knex.raw(
        'TIMESTAMPDIFF(MINUTE, started_at, finished_at) AS diff_minutes',
      ),
    )
    .where('technician_tasks.state', 'done')
    .groupBy('type', 'type_id');
};

export const allTasksSql = ({
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
  return knex
    .queryBuilder()
    .select(
      'tasks.type',
      r('tasks.rowId as typeId'),
      'tasks.rowId',
      'subType',
      'tasks.fullType',
      castInt('tasks.userId', { as: 'userId' }),
      'contractId',
      'clientId',
      'duoDate',
      castInt('isDone'),
      'gf_clients.name as clientName',
      'gf_clients.contactPhone',
      'expectedDurationMinutes',
      'simIcc',
      ...coalesceAddressFieldsWithTwoReference('tasks', 'gf_clients', false),
      'done_task_durations.diff_minutes as time_to_resolve_minutes',
    )
    .from(
      knex
        .queryBuilder()
        .unionAll(
          queries.installation.internet({
            userId,
            startDate,
            endDate,
            globalUserId,
          }),
          queries.incidence.assistance({
            userId,
            startDate,
            endDate,
            globalUserId,
          }),
          queries.incidence.simDeliveries({ userId, startDate, endDate }),
        )
        .as('tasks'),
    )
    .leftJoin('gf_clients', {
      'gf_clients.id': 'tasks.clientId',
    })
    .leftJoin(technicianDoneTasks().as('done_task_durations'), {
      'done_task_durations.type': 'tasks.fullType',
      'done_task_durations.type_id': 'tasks.rowId',
    });
};
