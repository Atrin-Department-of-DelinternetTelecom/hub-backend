/* eslint-disable you-dont-need-lodash-underscore/find */
const { kUserIdRef, knexUsers } = require('./utils');
const moment = require('moment');
const knex = require('@lib/knex').intranet;
const _ = require('lodash');
const config = require('@config');
const { getAllRows } = require('@api/utils/knex/table');
const { castInt } = require('@api/utils/knex');
const { TechnicianTask } = require('@api/models/technician/technician_tasks');
const { Op } = require('sequelize');
const { errors } = require('@api/http/http_errors');
const { intranet } = require('@lib/knex');
const { associateBy, pluck } = require('@api/utils/collections');

const r = knex.raw.bind(knex);
const uid = config.get('index.intranet.uid');

const INCIDENCE_TYPE = 'incidence/assistance';

const tasksDeprecated = () =>
  knex
    .queryBuilder()
    .select(
      'type',
      'typeId',
      'contractId',
      'clientId',
      'userId',
      'duration',
      'duoDate',
      castInt('isDone'),
      'technicianTaskId',
      'cancelledById',
      'technician_id',
      'technician_state',
      'technician_started_at',
      'finishedAt',
      'autoCloseAt',
      'technician_cancelled_by',
      'technician_cancel_reason_description',
      'technician_cancel_reason_id',
      'technician_cancel_reason_label',
      'reference',
      'technician_deleted_at',
      'technician_cancelled_at',
    )
    .from(
      knex
        .queryBuilder()
        .unionAll(
          knex('gf_assists')
            .select(
              r("'incidence/assistance' as type"),
              'gf_assists.id as typeId',
              'gf_assists.contractId',
              'gf_assists.clientId',
              r(
                'IFNULL(delinternet_hub.technician_tasks.technician_user_id, global_users.id) as userId',
              ),
              r('IFNULL(gf_assists.duration, 60) as duration'),
              'previsionDate as duoDate',
              'closed as isDone',
              'delinternet_hub.technician_tasks.id as technicianTaskId',
              'delinternet_hub.technician_tasks.id as technician_id',
              'delinternet_hub.technician_tasks.state as technician_state',
              'delinternet_hub.technician_tasks.started_at as technician_started_at',
              'delinternet_hub.technician_tasks.cancelled_by as technician_cancelled_by',
              'delinternet_hub.technician_tasks.cancel_reason_description as technician_cancel_reason_description',
              'delinternet_hub.technician_cancel_reasons.label as technician_cancel_reason_label',
              'delinternet_hub.technician_cancel_reasons.id as technician_cancel_reason_id',
              'delinternet_hub.technician_tasks.deleted_at as technician_deleted_at',
              'delinternet_hub.technician_tasks.cancelled_at as technician_cancelled_at',
              'delinternet_hub.technician_tasks.cancelled_by_id as cancelledById',
              'delinternet_hub.technician_tasks.finished_at as finishedAt',
              'delinternet_hub.technician_tasks.auto_close_at as autoCloseAt',
              'gf_contracts.reference',
            )
            .innerJoin('delinternet_hub.global_users', {
              'global_users.gf_user_id': 'gf_assists.gfUserId',
            })
            .join('gf_contracts', function () {
              this.on('gf_contracts.id', '=', 'gf_assists.contractId').andOn(
                'gf_contracts.status',
                '=',
                1,
              );
            })
            .leftJoin('delinternet_hub.technician_tasks', function () {
              this.on('technician_tasks.type_id', '=', 'gf_assists.id').andOn(
                'technician_tasks.type',
                '=',
                knex.raw('?', ['incidence/assistance']),
              );
            })
            .leftJoin('delinternet_hub.technician_cancel_reasons', function () {
              this.on(
                'technician_tasks.cancel_reason_id',
                '=',
                'technician_cancel_reasons.id',
              );
            })
            .where({
              'gf_assists.status': 1,
              'gf_assists.uid': uid,
            })
            .whereNot((subBuilder) => {
              subBuilder
                .where('technician_tasks.state', 'cancelled')
                .where('gf_assists.closed', true);
            }),
          knex('gf_contract_data_internet')
            .select(
              r(
                "IF(active_gf_fees_view.internetTechnology = 'fibra', 'installation/fibra', 'installation/radio') as type",
              ),
              'gf_contract_data_internet.id as typeId',
              'gf_contract_data_internet.contractId',
              'gf_contracts.clientId',
              r(
                'IFNULL(delinternet_hub.technician_tasks.technician_user_id, global_users.id) as userId',
              ),
              r('120 as duration'),
              'instalationDate as duoDate',
              r('IFNULL(installationDone, 0) as isDone'),
              'delinternet_hub.technician_tasks.id as technicianTaskId',
              'delinternet_hub.technician_tasks.id as technician_id',
              'delinternet_hub.technician_tasks.state as technician_state',
              'delinternet_hub.technician_tasks.started_at as technician_started_at',
              'delinternet_hub.technician_tasks.cancelled_by as technician_cancelled_by',
              'delinternet_hub.technician_tasks.cancel_reason_description as technician_cancel_reason_description',
              'delinternet_hub.technician_cancel_reasons.label as technician_cancel_reason_label',
              'delinternet_hub.technician_cancel_reasons.id as technician_cancel_reason_id',
              'delinternet_hub.technician_tasks.deleted_at as technician_deleted_at',
              'delinternet_hub.technician_tasks.cancelled_at as technician_cancelled_at',
              'delinternet_hub.technician_tasks.cancelled_by_id as cancelledById',
              'delinternet_hub.technician_tasks.finished_at as finishedAt',
              'delinternet_hub.technician_tasks.auto_close_at as autoCloseAt',
              'gf_contracts.reference',
            )
            .innerJoin('delinternet_hub.global_users', {
              'global_users.user_id':
                'gf_contract_data_internet.installatorUserId',
            })
            .join(
              'gf_contracts',
              'gf_contracts.id',
              'gf_contract_data_internet.contractId',
            )
            .leftJoin(
              'active_gf_fees_view',
              'gf_contracts.feeGroupId',
              'active_gf_fees_view.feeGroupId',
            )
            .leftJoin('delinternet_hub.technician_tasks', function () {
              this.on(
                'technician_tasks.type_id',
                '=',
                'gf_contract_data_internet.id',
              ).andOn(
                'technician_tasks.type',
                '=',
                knex.raw(`
                  IF(active_gf_fees_view.internetTechnology = 'fibra', 
                  'installation/fibra', 
                  'installation/radio')
                `),
              );
            })
            .leftJoin('delinternet_hub.technician_cancel_reasons', function () {
              this.on(
                'technician_tasks.cancel_reason_id',
                '=',
                'technician_cancel_reasons.id',
              );
            })
            .where({
              'gf_contract_data_internet.status': 1,
              'gf_contract_data_internet.uid': uid,
              'gf_contracts.status': 1,
            }),
        )
        .as('tasks'),
    );

const tasks = (includeSoftDeletes = false) => {
  const query = knex
    .table('technician_tasks_with_coworkers as tasks')
    .select('*');

  return includeSoftDeletes
    ? query
    : query.whereNull('tasks.technician_deleted_at');
};

exports.tasksWithTechnicianAttachedTaskDeprecated = () =>
  tasksDeprecated()
    .leftJoin('gf_clients', 'gf_clients.id', 'tasks.clientId')
    .innerJoin('delinternet_hub.global_users as technician', {
      'technician.id': 'tasks.userId',
    })
    .leftJoin('delinternet_hub.global_users as cancelledByUser', {
      'cancelledByUser.id': 'tasks.cancelledById',
    });

exports.tasksWithTechnicianAttachedTask = () =>
  tasks()
    .leftJoin('gf_clients', 'gf_clients.id', 'tasks.clientId')
    .innerJoin('delinternet_hub.global_users as technician', {
      'technician.id': 'tasks.userId',
    })
    .leftJoin('delinternet_hub.global_users as cancelledByUser', {
      'cancelledByUser.id': 'tasks.cancelledById',
    });

exports.getTechnicians = async (query) => {
  const sql = knex
    .queryBuilder()
    .select(
      'global_users.id',
      'global_users.first_name',
      'global_users.last_name',
      'global_users.gf_user_id',
      'global_users.user_id',
      'global_users.enable as active',
      r('IF(stats_pinned_rows.id, true, false) as is_pinned'),
    )
    .from('delinternet_hub.global_users')
    .leftJoin('delinternet_hub.stats_pinned_rows', function () {
      this.on('stats_pinned_rows.row_id', '=', 'global_users.id').andOn(
        'stats_pinned_rows.table_name',
        '=',
        knex.raw('?', ['technicians']),
      );
    });

  return getAllRows({
    sql,
    query,
  });
};

const binaryInsert = (arr, item, compare) => {
  let low = 0,
    high = arr.length;

  while (low < high) {
    const mid = (low + high) >>> 1; // bitwise shift for floor division by 2
    if (compare(arr[mid], item) < 0) low = mid + 1;
    else high = mid;
  }

  arr.splice(low, 0, item); // insert item at the correct position
};

const technicianTasksObjectDTO = ({
  clientName,
  typeId,
  clientId,
  type,
  duoDate,
  contractId,
  isDone,
  technicianTaskId,
  technicianState,
  startedAt,
  finishedAt,
  autoCloseAt,
  technicianCancelledBy,
  technicianCancelReasonDescription,
  technicianCancelReasonId,
  technicianCancelReasonLabel,
  technicianId,
  first_name,
  last_name,
  email,
  reference,
  technicianDeletedAt,
  technicianCancelledAt,
  duration,
  cancelledById,
  cancelled_by_first_name,
  cancelled_by_last_name,
  cancelled_by_email,
  assistId,
  assistGfUserId,
  assistAlias,
  assistIncidenceId,
  internetId,
  internetInstaller,
}) => ({
  clientName,
  typeId,
  clientId,
  type,
  duoDate,
  contractId,
  isDone,
  duration,
  technicianTaskId,
  startedAt,
  finishedAt,
  autoCloseAt,
  technicianState,
  technicianId,
  technician: {
    id: technicianId,
    first_name,
    last_name,
    email,
  },
  cancelledById,
  cancelledByUser: cancelledById
    ? {
        id: cancelledById,
        first_name: cancelled_by_first_name,
        last_name: cancelled_by_last_name,
        email: cancelled_by_email,
      }
    : null,
  contract: {
    id: contractId,
    reference,
  },
  technicianTask: technicianTaskId
    ? {
        id: technicianTaskId,
        startedAt,
        finishedAt,
        cancelleAt: technicianCancelledAt,
        autoCloseAt,
        cancelledBy: technicianCancelledBy,
        cancelReasonDescription: technicianCancelReasonDescription,
        cancelReason: technicianCancelReasonId
          ? {
              id: technicianCancelReasonId,
              label: JSON.parse(technicianCancelReasonLabel ?? '{}'),
            }
          : null,
        steps: [],
        technicianDeletedAt,
      }
    : null,
  assistance: assistId
    ? {
        id: assistId,
        alias: assistAlias,
        incidenceId: assistIncidenceId,
        gfUserId: assistGfUserId,
      }
    : null,
  dataInternet: internetId
    ? {
        id: internetId,
        installerUserId: internetInstaller,
      }
    : null,
});

exports.getTechnicianDeprecated = async (query, includeSoftDeletes = false) => {
  const sql = exports
    .tasksWithTechnicianAttachedTaskDeprecated()
    .leftJoin(
      'delinternet_hub.technician_steps',
      'technician_steps.task_id',
      'tasks.technicianTaskId',
    )
    .clearSelect()
    .select(
      'gf_clients.name as clientName',
      'tasks.typeId',
      'tasks.clientId',
      'tasks.type',
      'tasks.duoDate',
      'tasks.duration',
      'tasks.contractId',
      'tasks.isDone',
      'tasks.technicianTaskId',
      'technician.id as userId',
      'technician.id as technicianId',
      'technician.first_name as first_name',
      'technician.last_name as last_name',
      'technician.email as email',
      'finishedAt',
      'autoCloseAt',
      knex.raw('IFNULL(tasks.technician_state, "pending") as technicianState'),
      knex.raw('tasks.technician_started_at as startedAt'),
      'tasks.technician_cancelled_by as technicianCancelledBy',
      'tasks.technician_cancel_reason_description as technicianCancelReasonDescription',
      'tasks.technician_cancel_reason_label as technicianCancelReasonLabel',
      'tasks.technician_cancel_reason_id as technicianCancelReasonId',
      'tasks.reference',
      'tasks.technician_deleted_at as technicianDeletedAt',
      'tasks.technician_cancelled_at as technicianCancelledAt',
      'cancelledByUser.id as cancelledById',
      'cancelledByUser.first_name as cancelled_by_first_name',
      'cancelledByUser.last_name as cancelled_by_last_name',
      'cancelledByUser.email as cancelled_by_email',
      'technician_steps.id as technician_steps_id',
      'technician_steps.task_id as technician_steps_task_id',
      'technician_steps.name as technician_steps_name',
      'technician_steps.index as technician_steps_index',
      'technician_steps.state as technician_steps_state',
      'technician_steps.error as technician_steps_error',
      'technician_steps.created_at as technician_steps_created_at',
      'technician_steps.updated_at as technician_steps_updated_at',
    );

  if (!includeSoftDeletes) sql.whereNull('tasks.technician_deleted_at');

  return getAllRows({
    sql,
    query,
    reduce: (acc, task) => {
      const mappedData = technicianTasksObjectDTO(task);
      const { technicianTaskId, typeId, type } = task;
      if (!technicianTaskId) acc[`${typeId}-${type}`] = mappedData;
      else {
        const taskKey = `${typeId}-${type}-${technicianTaskId}`;
        if (!acc[taskKey]) acc[taskKey] = mappedData;

        const step = {
          id: task.technician_steps_id,
          taskId: task.technician_steps_task_id,
          name: task.technician_steps_name,
          index: task.technician_steps_index,
          state: task.technician_steps_state,
          error: task.technician_steps_error,
          updatedAt: task.technician_steps_updated_at,
          createdAt: task.technician_steps_created_at,
        };

        binaryInsert(
          acc[taskKey].technicianTask.steps,
          step,
          (a, b) => a.index - b.index,
        );
      }
      return acc;
    },
    paginateOn: ['type', 'typeId', 'technicianTaskId'],
  });
};

exports.getTechniciansTotalsDeprecated = async (userId, query) => {
  const { startDate: _start, endDate: _end } = query;
  const startDate = _start ? moment(_start) : moment(0);
  const endDate = _end ? moment(_end) : moment();

  /** @type {[string, string]} */
  const dateRange = [
    startDate.format('YYYY-MM-DD'),
    endDate.format('YYYY-MM-DD'),
  ];

  const taskWithDateRange = () =>
    tasksDeprecated()
      .whereBetween('tasks.duoDate', dateRange)
      .where('tasks.userId', userId)
      .whereNull('tasks.technician_deleted_at');

  const combinedQuery = await knex.select(
    knex.raw('(SELECT COUNT(*) FROM ?? WHERE ?? = ?) AS ??', [
      taskWithDateRange().as('t'),
      't.isDone',
      1,
      'done',
    ]),
    knex.raw('(SELECT COUNT(*) FROM ?? WHERE ?? = ?) AS ??', [
      taskWithDateRange().as('t'),
      't.isDone',
      0,
      'pending',
    ]),
    knex.raw('(SELECT COUNT(*) FROM ?? WHERE ?? = ?) AS ??', [
      taskWithDateRange().as('t'),
      't.technician_state',
      'cancelled',
      'cancelled',
    ]),
  );
  return combinedQuery[0];
};

const technicianTasks = (
  includeSoftDeletes = false,
  withCoWorkerTasks = false, // to load task built for the co-workers
) => {
  const query = exports
    .tasksWithTechnicianAttachedTask()
    .leftJoin(
      'delinternet_hub.technician_steps',
      'technician_steps.task_id',
      'tasks.technicianTaskId',
    )
    .clearSelect()
    .select(
      'gf_clients.name as clientName',
      'tasks.typeId',
      'tasks.clientId',
      'tasks.type',
      'tasks.duoDate',
      'tasks.duration',
      'tasks.contractId',
      'tasks.isDone',
      'tasks.technicianTaskId',
      'technician.id as userId',
      'technician.id as technicianId',
      'technician.first_name as first_name',
      'technician.last_name as last_name',
      'technician.email as email',
      'finishedAt',
      'autoCloseAt',
      knex.raw('IFNULL(tasks.technician_state, "pending") as technicianState'),
      knex.raw('tasks.technician_started_at as startedAt'),
      'tasks.technician_cancelled_by as technicianCancelledBy',
      'tasks.technician_cancel_reason_description as technicianCancelReasonDescription',
      'tasks.technician_cancel_reason_label as technicianCancelReasonLabel',
      'tasks.technician_cancel_reason_id as technicianCancelReasonId',
      'tasks.reference',
      'tasks.technician_deleted_at as technicianDeletedAt',
      'tasks.technician_cancelled_at as technicianCancelledAt',
      'cancelledByUser.id as cancelledById',
      'cancelledByUser.first_name as cancelled_by_first_name',
      'cancelledByUser.last_name as cancelled_by_last_name',
      'cancelledByUser.email as cancelled_by_email',
      'technician_steps.id as technician_steps_id',
      'technician_steps.task_id as technician_steps_task_id',
      'technician_steps.name as technician_steps_name',
      'technician_steps.index as technician_steps_index',
      'technician_steps.state as technician_steps_state',
      'technician_steps.error as technician_steps_error',
      'technician_steps.created_at as technician_steps_created_at',
      'technician_steps.updated_at as technician_steps_updated_at',
    );
  // handle soft deletes
  if (!includeSoftDeletes) query.whereNull('tasks.technician_deleted_at');
  // handle soft deletes
  if (!withCoWorkerTasks) query.where('tasks.isCoWorker', false);

  return query;
};

const transformTechnicianTasks = (acc, task) => {
  const mappedData = technicianTasksObjectDTO(task);
  const { technicianTaskId, typeId, type, technicianId } = task;
  if (!technicianTaskId) acc[`${typeId}-${type}-${technicianId}`] = mappedData;
  else {
    const taskKey = `${typeId}-${type}-${technicianTaskId}-${technicianId}`;
    if (!acc[taskKey]) acc[taskKey] = mappedData;

    const step = {
      id: task.technician_steps_id,
      taskId: task.technician_steps_task_id,
      name: task.technician_steps_name,
      index: task.technician_steps_index,
      state: task.technician_steps_state,
      error: task.technician_steps_error,
      updatedAt: task.technician_steps_updated_at,
      createdAt: task.technician_steps_created_at,
    };

    binaryInsert(
      acc[taskKey].technicianTask.steps,
      step,
      (a, b) => a.index - b.index,
    );
  }
  return acc;
};

exports.getTechnician = async (query, includeSoftDeletes = false) => {
  const technician = query.search?.whereQuery?.technician;
  const technicianIds = (Array.isArray(technician) ? technician : [technician])
    .filter(Boolean)
    .map(Number);

  // Now apply those to your query
  const response = await getAllRows({
    sql: technicianTasks(includeSoftDeletes),
    query,
    reduce: transformTechnicianTasks,
    paginateOn: ['type', 'typeId', 'technicianTaskId'],
    scopes: {
      technician: (db) => applyTechnicianScope(db, technicianIds),
    },
  });

  const { assistance, installer } = await coWorkers();

  return response.transform((data) => {
    return data.map((task) => {
      if (task.type === 'incidence/assistance') {
        task.coWorkers = assistance
          .filter((pivot) => pivot.gf_assist_id === task.typeId)
          .map(coWorkerDto);
      } else {
        task.coWorkers = installer
          .filter((pivot) => pivot.gf_contract_data_internet_id === task.typeId)
          .map(coWorkerDto);
      }

      return task;
    });
  });
};

const applyTechnicianScope = async (queryBuilder, technicianIds) => {
  const { assistIds, internetIds } = await technicianAssignedTasks(
    technicianIds,
  );

  queryBuilder.where((builder) => {
    builder
      .whereIn('userId', technicianIds)
      .orWhere((qb) => {
        qb.whereIn('typeId', assistIds).andWhere('type', INCIDENCE_TYPE);
      })
      .orWhere((qb) => {
        qb.whereIn('typeId', internetIds).andWhereNot('type', INCIDENCE_TYPE);
      });
  });
};

const technicianAssignedTasks = async (technicianIds) => {
  const tasks = { assistIds: [], internetIds: [] };

  if (technicianIds.length == 0) {
    return tasks;
  }

  const [assistIds, internetIds] = await Promise.all([
    intranet
      .table('gf_assist_co_workers')
      .whereIn('user_id', technicianIds)
      .then((rows) => rows.map((r) => r.gf_assist_id)),

    intranet
      .table('installation_co_workers')
      .whereIn('user_id', technicianIds)
      .then((rows) => rows.map((r) => r.gf_contract_data_internet_id)),
  ]);
  tasks.assistIds = assistIds;
  tasks.internetIds = internetIds;

  return tasks;
};

const coWorkers = async ({ assistance, installer } = {}) => {
  const assistanceQuery = knex
    .table('intranet.gf_assist_co_workers as co')
    .join('delinternet_hub.global_users as u', 'co.user_id', 'u.id');

  if (Array.isArray(assistance)) {
    assistanceQuery.whereIn('co.gf_assist_id', assistance);
  }

  const installerQuery = knex
    .table('intranet.installation_co_workers as co')
    .join('delinternet_hub.global_users as u', 'co.user_id', 'u.id');

  if (Array.isArray(installer)) {
    installerQuery.whereIn('co.gf_contract_data_internet_id', installer);
  }

  const [installerUsers, assistanceUsers] = await Promise.all([
    installerQuery,
    assistanceQuery,
  ]);

  return { assistance: assistanceUsers, installer: installerUsers };
};
exports.getScheduledTasks = async (query, includeSoftDeletes = false) => {
  const { startDate, endDate } = query;
  const dateRange = [startDate, endDate];

  if (moment(startDate).isAfter(moment(endDate))) {
    throw new errors.BadRequest('The start date cannot be after the end date.');
  }

  if (Math.abs(moment(startDate).diff(moment(endDate), 'days')) > 60) {
    throw new errors.BadRequest('The date range cannot exceed two month.');
  }

  const tasks = await technicianTasks(includeSoftDeletes, true)
    .whereBetween('tasks.duoDate', dateRange)
    .orWhereBetween('tasks.technician_started_at', dateRange)
    .leftJoin('intranet.gf_assists as assists', function () {
      this.on('assists.id', 'typeId').andOnVal('type', INCIDENCE_TYPE);
    })
    .leftJoin('intranet.gf_contract_data_internet as gcdi', function () {
      this.on('gcdi.id', 'typeId').andOnVal('type', '!=', INCIDENCE_TYPE);
    })
    .column(
      'assists.id as assistId',
      'assists.gfUserId as assistGfUserId',
      'assists.alias as assistAlias',
      'assists.incidenceId as assistIncidenceId',
      'gcdi.id as internetId',
      'gcdi.installatorUserId as internetInstaller',
    );

  const normalizedTasks = Object.values(
    tasks.reduce(transformTechnicianTasks, {}),
  );

  const taskWithCoWorkers = await exports.loadCoWorkers(normalizedTasks);
  const taskWithNextTechnicians = await loadNextTechnicians(taskWithCoWorkers);
  const taskWithEvents = await loadEvents(taskWithNextTechnicians);

  return _.groupBy(taskWithEvents, 'technicianId');
};

const loadEvents = async (tasks) => {
  const events = await knex
    .table('intranet.crm_tasks')
    .join(
      'intranet.crm_task_types',
      'crm_tasks.taskTypeId',
      'crm_task_types.id',
    )
    .whereIn('altId', pluck(tasks, 'contractId'))
    .where('altIdType', 'gf_contracts')
    .select(
      'crm_tasks.id',
      'crm_tasks.alias',
      'crm_tasks.altIdType',
      'crm_tasks.altId',
      'crm_task_types.name as typeName',
      'crm_task_types.id as typeId',
    );

  return tasks.map((task) => {
    task.events = events
      .filter(({ altId }) => altId === task.contractId)
      .map(({ id, alias, typeName, typeId }) => ({
        id,
        alias,
        taskType: { name: typeName, id: typeId },
      }));

    return task;
  });
};

const loadNextTechnicians = async (tasks) => {
  const gfUserIds = [];
  const userIds = [];
  tasks.forEach(({ assistance, dataInternet }) => {
    if (assistance) {
      gfUserIds.push(assistance.gfUserId);
    }
    if (dataInternet) {
      userIds.push(dataInternet.installerUserId);
    }
  });

  const users = await knex
    .table('delinternet_hub.global_users')
    .whereIn('user_id', userIds)
    .orWhereIn('gf_user_id', gfUserIds)
    .select('*');

  const keyByUserId = associateBy(users, ({ user_id }) => user_id);
  const keyByGfUserId = associateBy(users, ({ gf_user_id }) => gf_user_id);

  return tasks.map((task) => {
    const nextTechnician =
      task.type === INCIDENCE_TYPE
        ? keyByGfUserId[task.assistance?.gfUserId] ?? null
        : keyByUserId[task.dataInternet?.installerUserId] ?? null;

    task.nextTechnician = null;

    if (
      task.technicianState === 'cancelled' &&
      nextTechnician &&
      nextTechnician.id !== task.technician.id
    ) {
      task.nextTechnician = coWorkerDto(nextTechnician);
    }

    return task;
  });
};

exports.loadTechnicians = async (tasks) => {
  const users = await knex
    .table('delinternet_hub.global_users')
    .whereIn('user_id', pluck(tasks, 'userId'))
    .select('*');

  return tasks.map((task) => {
    task.technician =
      users.find(({ user_id }) => user_id === task.userId) ?? null;

    return task;
  });
};

exports.loadCoWorkers = async (tasks) => {
  const installers = [];
  const assistance = [];

  tasks.forEach(({ type, typeId, id }) => {
    if (!type) {
      console.warn(
        `[StatsTechnicianService][loadCoWorkers] Invalid task with id [${id}]!`,
      );
      return;
    }

    if (type.includes('incidence')) {
      assistance.push(typeId);
    } else {
      installers.push(typeId);
    }
  });

  const [assistanceUsers, installerUsers] = await Promise.all([
    knex
      .table('intranet.gf_assist_co_workers as co')
      .join('delinternet_hub.global_users as u', 'co.user_id', 'u.id')
      .whereIn('co.gf_assist_id', assistance),
    knex
      .table('intranet.installation_co_workers as co')
      .join('delinternet_hub.global_users as u', 'co.user_id', 'u.id')
      .whereIn('co.gf_contract_data_internet_id', installers),
  ]);

  return tasks.map((task) => {
    task.coWorkers = [];
    if (!task.type) {
      console.warn(
        `[StatsTechnicianService][loadCoWorkers] Invalid task with id [${task.id}]!`,
      );
      return task;
    }
    // set co-workers
    if (task.type.includes('incidence')) {
      task.coWorkers = assistanceUsers
        .filter((user) => task.typeId == user.gf_assist_id)
        .map(coWorkerDto);
    } else {
      task.coWorkers = installerUsers
        .filter((user) => task.typeId == user.gf_contract_data_internet_id)
        .map(coWorkerDto);
    }

    return task;
  });
};

const coWorkerDto = ({ id, first_name, last_name, email }) => ({
  id,
  first_name,
  last_name,
  email,
});

exports.getTechniciansTotals = async (userId, query) => {
  const { startDate: _start, endDate: _end } = query;
  const startDate = _start ? moment(_start) : moment(0);
  const endDate = _end ? moment(_end) : moment();

  /** @type {[string, string]} */
  const dateRange = [
    startDate.format('YYYY-MM-DD'),
    endDate.format('YYYY-MM-DD'),
  ];

  const taskWithDateRange = () =>
    tasks()
      .whereBetween('tasks.duoDate', dateRange)
      .where('tasks.userId', userId)
      .whereNull('tasks.technician_deleted_at');

  const combinedQuery = await knex.select(
    knex.raw('(SELECT COUNT(*) FROM ?? WHERE ?? = ?) AS ??', [
      taskWithDateRange().as('t'),
      't.isDone',
      1,
      'done',
    ]),
    knex.raw('(SELECT COUNT(*) FROM ?? WHERE ?? = ?) AS ??', [
      taskWithDateRange().as('t'),
      't.isDone',
      0,
      'pending',
    ]),
    knex.raw('(SELECT COUNT(*) FROM ?? WHERE ?? = ?) AS ??', [
      taskWithDateRange().as('t'),
      't.technician_state',
      'cancelled',
      'cancelled',
    ]),
  );
  return combinedQuery[0];
};

exports.getAllTechniciansTotals = async (query) => {
  const { startDate: _start, endDate: _end, includeSoftDeletes } = query;

  const totals = await tasks(includeSoftDeletes)
    .whereBetween('tasks.duoDate', [_start, _end ?? moment().toISOString()])
    .groupBy('tasks.userId')
    .clearSelect()
    .select(
      'tasks.userId',
      knex.raw('SUM(CASE WHEN tasks.isDone = 1 THEN 1 ELSE 0 END) AS done'),
      knex.raw(
        "SUM(CASE WHEN tasks.isDone = 0 AND (technician_state = 'pending' OR technician_state IS NULL) THEN 1 ELSE 0 END) AS pending",
      ),
      knex.raw(
        "SUM(CASE WHEN tasks.technician_state = 'in_progress' THEN 1 ELSE 0 END) AS inProgress",
      ),
      knex.raw(
        'SUM(CASE WHEN tasks.isDone = 1 AND tasks.isCoWorker = 1 THEN 1 ELSE 0 END) AS doneCoWorker',
      ),
      knex.raw(
        "SUM(CASE WHEN tasks.isDone = 0 AND tasks.isCoWorker = 1 AND (technician_state = 'pending' OR technician_state IS NULL) THEN 1 ELSE 0 END) AS pendingCoWorker",
      ),
      knex.raw(
        "SUM(CASE WHEN tasks.technician_state = 'in_progress' AND tasks.isCoWorker = 1 THEN 1 ELSE 0 END) AS inProgressCoWorker",
      ),
    );

  const cancelled = await cancelledTask({ _start, _end, includeSoftDeletes });

  return totals.map(
    ({
      userId,
      done,
      pending,
      inProgress,
      doneCoWorker,
      pendingCoWorker,
      inProgressCoWorker,
    }) => ({
      userId: Number(userId),
      done: Number(done),
      pending: Number(pending),
      inProgress: Number(inProgress),
      cancelled: cancelled.filter(
        ({ technician_user_id }) => technician_user_id == userId,
      ).length,
      asCoWorker: {
        done: Number(doneCoWorker),
        pending: Number(pendingCoWorker),
        inProgress: Number(inProgressCoWorker),
        cancelled: cancelled.filter(({ coWorkers }) =>
          coWorkers.find(({ id }) => userId),
        ).length,
      },
    }),
  );
};

const cancelledTask = async ({ _start, _end, includeSoftDeletes }) => {
  const tasks = await TechnicianTask.findAll({
    where: {
      created_at: {
        [Op.between]: [_start, _end ?? moment().toISOString()],
      },
      cancelled_by: ['re_schedule', 'technician', 'timeout'],
      state: 'cancelled',
      ...(includeSoftDeletes ? {} : { deleted_at: null }),
    },
    attributes: ['technician_user_id'],
    raw: true,
  });

  return exports.loadCoWorkers(tasks);
};
