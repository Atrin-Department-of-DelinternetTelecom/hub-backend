'use strict';

const {
  intranet: {
    CrTask,
    CrTaskType,
    CrTaskExtraField,
    CrmUser,
    CrTaskLog,
    GfClient,
    GfContract,
    CrTaskExtraFieldXref,
    CrTaskUserXref,
    GfFeeGroup,
    GfSection,
    CrNotificationPreference,
    GfUser,
    GfIncidence,
    InvoiceClientsExtraField,
    InvoiceClient,
  },
  moozaic: { GlobalNotificationsHistory },
  system: { User },
} = require('@models');

const { Op, where } = require('sequelize');

const CrmTaskHelperService = require('./CrmTaskHelperService');

const MessageService = require('./MessageService');

const { getAllEntities, findAndUpdate } = require('@utils/request-handler');

const GfCrmService = require('./GfCrmService');

const {
  respondBadRequest,
  respondNotFound,
  respondSuccess,
  respondCreated,
  respondSuccessWithPagination,
} = require('@utils/response');

const _ = require('lodash');

const moment = require('moment');
const assert = require('assert');

const { cleanObject, modelToJson } = require('@utils/tools');

const CrmGoogleService = require('./CrmGoogleService');

const { errors } = require('@api/http/http_errors');
const { intranet } = require('@lib/knex');
const { pluck, unique } = require('@api/utils/collections');
const { CONTRACT } = require('@api/constants/statuses');
const { query } = require('express');
const { Knex } = require('knex');

/**
 *
 * delete a crm task record by id
 *
 * id String
 * returns Object
 **/
exports.deleteCrmTasksId = async function (id, logedUserId, intranetUserId) {
  const crmTask = await CrTask.findByPk(id, {
    include: [
      {
        model: CrTaskUserXref,
        as: 'users',
        required: false,
        include: { model: CrmUser, as: 'user', required: false },
      },
      { model: CrTaskType, as: 'task_type' },
      { model: InvoiceClient, as: 'invoice_client' },
      { model: GfClient, as: 'client' },
    ],
  });
  if (!crmTask) return respondNotFound(`task with id ${id} not found`);
  await removeRelationalEntitiesToCrm(id);
  await CrmTaskHelperService.recordLog(crmTask, 'delete', intranetUserId);

  crmTask.status = 0;
  await crmTask.save();
  await CrmTaskHelperService.setNotification({
    crmTask,
    logedUserId,
  });
  await CrmGoogleService._syncEvent({ eventId: crmTask.id }, intranetUserId);
  await crmTask.save();
  return respondSuccess(`crm task with id ${id} successfully deleted.`);
};

/**
 * delete all m to n(xref) related to this crm entity
 * @param {number} taskId id of crm task
 */
const removeRelationalEntitiesToCrm = async (taskId) => {
  await CrTaskExtraFieldXref.update({ status: 0 }, { where: { taskId } });
  await CrTaskUserXref.update({ status: 0 }, { where: { taskId } });
};

/**
 * Your GET endpoint
 * get all crm tasks record
 *
 * returns Object
 **/
exports.getCrmTasks = async function (query) {
  const { executed, taskType } = extractExecutable(query);
  return getAllEntities(query, CrTask, executed, [
    {
      model: CrTaskType,
      as: 'task_type',
      required: false,
      where: taskType,
    },
    {
      model: CrmUser,
      as: 'creator',
      required: false,
    },
    {
      model: CrTaskExtraFieldXref,
      as: 'extra_fields',
      required: false,
      include: {
        model: CrTaskExtraField,
        as: 'extra_field',
        required: false,
      },
    },
    {
      model: CrTaskUserXref,
      as: 'users',
      include: {
        model: CrmUser,
        as: 'user',
        required: false,
        where: { status: [0, 1] },
      },
      required: false,
    },
    {
      model: GfClient,
      as: 'client',
      required: false,
    },
    {
      model: GfContract,
      as: 'contract',
      required: false,
      include: {
        model: GfFeeGroup,
        as: 'fee_group',
        include: {
          model: GfSection,
          as: 'sections',
          required: false,
        },
        required: false,
      },
    },
  ]);
};

exports.paginate = async (params, filters, orders) => {
  const page = Number(params.page) > 0 ? Number(params.page) : 1;
  const limit = Number(params.size) ?? 50;
  console.time('paginate tasks');
  const taskTypes = await getTaskTypes(filters);
  const query = intranet
    .table('crm_tasks')
    .where('crm_tasks.status', 1)
    .whereIn('crm_tasks.uid', [90, -1]);

  await applyFiltersAndOrders(query, taskTypes, filters, orders);
  // execute queries
  const [counts, data] = await Promise.all([
    query.clone().count('id as count'),
    query
      .limit(limit)
      .offset(limit * (page > 1 ? page - 1 : 0))
      .select(),
  ]);

  const [clients, creators, tags, users, contracts] = await Promise.all([
    intranet
      .table('gf_clients')
      .whereIn(
        'invoiceClientId',
        pluck(data, 'clientId').filter((id) => Number(id)),
      )
      .select([
        'id',
        'invoiceClientId',
        'fiscalId',
        'name',
        'contactName',
        'contactFamilyName1',
        'contactFamilyName2',
        'emailAddress',
        'addressRegion',
        'addressProvince',
        'addressCity',
        'addressPostalCode',
        'addressPostalCodeCode',
        'addressStreet',
        'addressNumber',
        'addressFloor',
        'addressBuilding',
        'addressDoor',
        'addressStairway',
      ]),
    intranet.table('crm_users').whereIn(
      'userId',
      pluck(data, 'userId').filter((id) => Number(id)),
    ),
    CrTaskExtraFieldXref.findAll({
      where: { taskId: pluck(data, 'id').filter((id) => Number(id)) },
      include: {
        model: CrTaskExtraField,
        as: 'extra_field',
        required: true,
        attributes: ['name', 'id'],
      },
    }),
    CrTaskUserXref.findAll({
      where: { taskId: pluck(data, 'id').filter((id) => Number(id)) },
      include: {
        model: CrmUser,
        as: 'user',
        required: true,
        where: { status: [0, 1] },
      },
    }),
    GfContract.findAll({
      where: { id: pluck(data, 'altId').filter((id) => Number(id)) },
      include: {
        model: GfFeeGroup,
        as: 'fee_group',
        include: { model: GfSection, as: 'sections', required: false },
        required: false,
      },
    }),
  ]);

  const tasks = data.map((task) => {
    let metadata = {};
    try {
      metadata = JSON.parse(task.refererMetadata ?? '[]');
    } catch (error) {
      //
    }

    const refererType = metadata.assistance
      ? 'assistance'
      : metadata.incidence
      ? 'incidence'
      : null;
    return {
      ...task,
      client:
        clients.find(({ invoiceClientId: id }) => task.clientId === id) ?? null,
      creator: creators.find(({ userId }) => task.userId === userId) ?? null,
      task_type: taskTypes.find(({ id }) => task.taskTypeId === id) ?? null,
      users: users.filter(({ taskId }) => task.id === taskId) ?? null,
      contract: contracts.find(({ id }) => task.altId === id) ?? null,
      extra_fields: tags.filter(({ taskId }) => taskId === task.id),
      refererType,
      refererId:
        refererType === 'assistance'
          ? metadata.assistanceId
          : refererType === 'incidence'
          ? metadata.incidenceId
          : null,
    };
  });

  console.timeEnd('paginate tasks');

  return respondSuccessWithPagination(tasks, counts[0].count, limit, page);
};

exports.calendarTasks = async (params, filters, orders) => {
  // validate calendar filter
  validateCalendarFilter(filters);
  // extract executable

  let hasMore = true;
  let page = 1;
  let lastId = 0;
  const chunk = 2000;
  const collection = [];

  console.time('calendarTasks');
  // get task types
  const taskTypes = await getTaskTypes(filters, ['id', 'name', 'label']);
  const query = intranet
    .table('crm_tasks')
    .where('crm_tasks.status', 1)
    .whereIn('crm_tasks.uid', [90, -1]);
  // apply executable filters
  await applyFiltersAndOrders(query, taskTypes, filters, orders);

  while (hasMore) {
    const fetchQuery = query.clone();
    const data = await fetchQuery
      .limit(chunk)
      .where('id', '>', lastId)
      .select(
        'alias',
        'displayUntil',
        'displayFrom',
        'id',
        'taskTypeId',
        'refererMetadata',
        'clientId',
        'userId',
      );

    page = page + 1;

    if (data.length) {
      lastId = data[data.length - 1].id;
      collection.push(...data);
    } else {
      hasMore = false;
    }
  }

  const [clients, creators, users] = await Promise.all([
    intranet
      .table('gf_clients')
      .whereIn(
        'invoiceClientId',
        pluck(collection, 'clientId').filter((id) => Number(id)),
      )
      .select(['id', 'invoiceClientId', 'fiscalId', 'name']),
    intranet
      .table('crm_users')
      .whereIn(
        'userId',
        pluck(collection, 'userId').filter((id) => Number(id)),
      )
      .select('id', 'userId', 'email'),
    CrTaskUserXref.findAll({
      where: { taskId: pluck(collection, 'id').filter((id) => Number(id)) },
      include: {
        model: CrmUser,
        as: 'user',
        required: true,
        where: { status: [0, 1] },
        attributes: ['id', 'userId', 'email', 'name', 'nickName'],
      },
    }),
  ]);

  const tasks = unique(collection, 'id').map((task) => {
    let metadata = {};
    try {
      metadata = JSON.parse(task.refererMetadata ?? '[]');
    } catch (error) {
      //
    }

    const refererType = metadata.assistance
      ? 'assistance'
      : metadata.incidence
      ? 'incidence'
      : null;
    return {
      ...task,
      metadata,
      client:
        clients.find(({ invoiceClientId: id }) => task.clientId === id) ?? null,
      creator: creators.find(({ userId }) => task.userId === userId) ?? null,
      task_type: taskTypes.find(({ id }) => task.taskTypeId === id) ?? null,
      users: users.filter(({ taskId }) => task.id === taskId) ?? null,
      refererType,
      refererId:
        refererType === 'assistance'
          ? metadata.assistanceId
          : refererType === 'incidence'
          ? metadata.incidenceId
          : null,
    };
  });

  console.timeEnd('calendarTasks');

  return respondSuccessWithPagination(tasks, tasks.length, tasks.length, 1);
};

const validateCalendarFilter = (filters) => {
  if (!filters.calendar) {
    throw new errors.BadRequest('calendar filter is required');
  }

  const start = Array.isArray(filters.calendar.value)
    ? filters.calendar.value[0]
    : filters.calendar.value;
  const end = Array.isArray(filters.calendar.value)
    ? filters.calendar.value[1] ?? filters.calendar.value[0]
    : filters.calendar.value;

  if (moment(start).diff(end, 'month') > 1) {
    throw new errors.BadRequest('calendar filter must be less than 1 month');
  }
};

/**
 * @param query {Knex.QueryBuilder}
 */
const applyFiltersAndOrders = async (
  query,
  taskTypes,
  filters = {},
  orders = {},
) => {
  query.whereIn('taskTypeId', pluck(taskTypes, 'id'));

  // calendar filters
  if (filters.scheduledForUser) {
    const users = await User.findAll({
      where: { id: filters.scheduledForUser.value },
    });
    delete filters.scheduledForUser;
    const ref = `scheduled_${Date.now()}`;
    const subQuery = intranet
      .table(`crm_tasks_users_xref AS ${ref}`)
      .select(1)
      .where(`${ref}.status`, 1)
      .whereIn(`${ref}.userId`, pluck(users, 'crm_user_id'))
      .where(`${ref}.taskId`, intranet.raw('crm_tasks.id'));

    query.whereExists(subQuery);
  }

  // calendar filters
  if (filters.hasSubscriber) {
    const ref = `subscribed_${Date.now()}`;
    const subQuery = intranet
      .table(`crm_tasks_users_xref AS ${ref}`)
      // .join('crm_users', 'crm_users.userId', intranet.raw(`${ref}.userId`))
      .select(1)
      .where(`${ref}.status`, 1)
      .where(`${ref}.taskId`, intranet.raw('crm_tasks.id'));

    query[
      Number(filters.hasSubscriber.value) ? 'whereExists' : 'whereNotExists'
    ](subQuery);
    // then remove filter
    delete filters.hasSubscriber;
  }

  if (filters.calendar) {
    const start = Array.isArray(filters.calendar.value)
      ? filters.calendar.value[0]
      : filters.calendar.value;
    const end = Array.isArray(filters.calendar.value)
      ? filters.calendar.value[1] ?? filters.calendar.value[0]
      : filters.calendar.value;

    query.where(function () {
      this.where(
        'crm_tasks.displayUntil',
        '>=',
        moment(start).startOf('day').toISOString(),
      ).where(
        'crm_tasks.displayFrom',
        '<=',
        moment(end).endOf('day').toISOString(),
      );
    });
    delete filters.calendar;
  }

  // failed resumes query
  if (filters.failedResumes) {
    delete filters.failedResumes;
    const ref = `gc_${Date.now()}`;
    const subQuery = intranet
      .table(`gf_contracts AS ${ref}`)
      .select(1)
      .where(`${ref}.status`, 1)
      .where(`${ref}.id`, intranet.raw('crm_tasks.altId'))
      .where(intranet.raw('crm_tasks.refererTrace LIKE ?', ['doUnBlock%']))
      .whereNot(function () {
        this.where(intranet.raw('crm_tasks.refererTrace LIKE ?', ['%-ignore']));
      })
      .whereIn(`${ref}.state`, [CONTRACT.BLOCKED]);

    query.where(function () {
      this.whereExists(subQuery).where(`crm_tasks.executed`, 0);
    });
  }

  // scope gf-clients
  if (filters.client) {
    const subQuery = intranet
      .table('gf_clients')
      .where('status', 1)
      .whereIn('uid', [90, -1]);
    Object.keys(filters.client.value).forEach((filter) => {
      subQuery.where(
        `gf_clients.${filter}`,
        filters.client?.value[filter].operator,
        filters.client?.value[filter].value,
      );
    });

    query.whereExists(
      subQuery.where(
        'gf_clients.invoiceClientId',
        intranet.raw(`crm_tasks.clientId`),
      ),
    );
  }

  // scope creator
  if (filters.creator) {
    const subQuery = intranet
      .table('crm_users')
      .where('status', 1)
      .whereIn('uid', [90, -1]);
    Object.keys(filters.creator.value).forEach((filter) => {
      subQuery.where(
        `crm_users.${filter}`,
        filters.creator?.value[filter].operator,
        filters.creator?.value[filter].value,
      );
    });

    query.whereExists(
      subQuery.where('crm_users.userId', intranet.raw(`crm_tasks.userId`)),
    );
  }
  // scope tags
  if (filters.extra_fields) {
    const subQuery = intranet
      .table('crm_tasks_extra_fields_xref')
      .where('status', 1)
      .whereIn('uid', [90, -1]);
    Object.keys(filters.extra_fields.value).forEach((filter) => {
      subQuery.where(
        `crm_tasks_extra_fields_xref.${filter}`,
        filters.extra_fields?.value[filter].operator,
        filters.extra_fields?.value[filter].value,
      );
    });

    query.whereExists(
      subQuery.where(
        'crm_tasks_extra_fields_xref.taskId',
        intranet.raw(`crm_tasks.id`),
      ),
    );
  }
  // scope users
  if (filters.users) {
    const subQuery = intranet
      .table('crm_tasks_users_xref')
      .where('status', 1)
      .whereIn('uid', [90, -1]);
    Object.keys(filters.users.value).forEach((filter) => {
      subQuery.where(
        `crm_tasks_users_xref.${filter}`,
        filters.users?.value[filter].operator,
        filters.users?.value[filter].value,
      );
    });

    query.whereExists(
      subQuery.where(
        'crm_tasks_users_xref.taskId',
        intranet.raw(`crm_tasks.id`),
      ),
    );
  }
  // apply filters
  Object.keys(filters).forEach((filter) => {
    if (!filters[filter].operator || filter.split('.').length > 1) {
      return;
    }
    query.where(filter, filters[filter].operator, filters[filter].value);
  });
  // apply orders

  if (orders['creator.name']) {
    const orderedUsers = pluck(
      await intranet
        .table('crm_users')
        .where('status', 1)
        .whereIn('uid', [-1, 90])
        .orderBy('name', orders['creator.name'].direction)
        .select('id'),
      'id',
    );

    query.orderByRaw(`FIELD(crm_tasks.userId, ${orderedUsers.join(',')})`);
  }

  Object.keys(orders).forEach((order) => {
    if (order.split('.').length > 1) {
      return;
    }

    query.orderBy(`crm_tasks.${order}`, orders[order].direction);
  });
};

const getTaskTypes = async (filters, columns = '*') => {
  // scope task-types
  const taskTypeQuery = intranet
    .table('crm_task_types')
    .where('status', 1)
    .whereIn('uid', [90, -1]);

  Object.keys(filters.task_type?.value ?? {}).forEach((filter) => {
    taskTypeQuery.where(
      filter,
      filters.task_type?.value[filter].operator,
      filters.task_type?.value[filter].value,
    );
  });

  const taskTypes = await taskTypeQuery.select(columns);

  return taskTypes.map((taskType) => ({
    ...taskType,
    label: parseLabel(taskType.label),
  }));
};

const parseLabel = (label) => {
  try {
    return JSON.parse(label) ?? {};
  } catch (error) {
    return {};
  }
};

const extractExecutable = (query) => {
  const executable = _.get(query, 'search.whereQuery.execute', false);
  let taskType = {};
  let executed = {};
  if (executable && ['0', '1'].includes(executable)) {
    executed = { executed: executable };
  } else if (executable) {
    taskType = { executable: 0 };
  }
  _.unset(query, 'search.whereQuery.execute');
  return {
    executed,
    taskType,
  };
};

exports.getCrmTasksForCalendar = async function ({
  fromDate,
  toDate,
  taskTypeIds,
  extraFieldIds,
  clientExtraFieldIds,
  userIds,
  executed,
}) {
  const query = {
    where: {
      previsionDate: {
        [Op.gte]: moment(fromDate).format('YYYY-MM-DD HH:mm:ss'),
        [Op.lte]: moment(toDate).format('YYYY-MM-DD HH:mm:ss'),
      },
    },
    order: [['previsionDate', 'ASC']],
    include: [
      {
        model: CrTaskType,
        as: 'task_type',
        required: false,
      },
      {
        model: CrTaskUserXref,
        as: 'users',
        where: cleanObject({
          userId: userIds,
        }),
      },
      {
        model: CrmUser,
        as: 'creator',
        required: false,
      },
      {
        model: CrTaskExtraFieldXref,
        as: 'extra_fields',
        where: cleanObject({
          extraFieldId: extraFieldIds,
        }),
      },
      {
        model: GfClient,
        as: 'client',
        include: {
          model: InvoiceClientsExtraField,
          as: 'extraFields',
          where: cleanObject({
            id: clientExtraFieldIds,
          }),
        },
      },
    ],
  };

  if (executed !== undefined) {
    query.where.executed = executed;
  }

  if (taskTypeIds !== undefined) {
    query.where.taskTypeId = taskTypeIds;
  }

  const tasks = await CrTask.findAll(query);

  return respondSuccess(tasks);
};

/**
 * Your GET endpoint
 * get single crm task record by id
 *
 * id String
 * returns Object
 **/
exports.getCrmTasksId = async function (id) {
  const crmTask = await CrTask.findByPk(id, {
    include: [
      {
        model: CrTaskType,
        as: 'task_type',
        required: false,
      },
      {
        model: User,
        as: 'system_user',
        required: false,
      },
      {
        model: CrmUser,
        as: 'creator',
        required: false,
      },
      {
        model: CrTaskLog,
        as: 'logs',
        required: false,
        include: {
          model: GfUser,
          as: 'user',
          required: false,
        },
      },
      {
        model: CrTaskExtraFieldXref,
        as: 'extra_fields',
        include: {
          model: CrTaskExtraField,
          as: 'extra_field',
          required: false,
        },
        required: false,
      },
      {
        model: CrTaskUserXref,
        as: 'users',
        include: {
          model: CrmUser,
          as: 'user',
          required: false,
          where: { status: [0, 1] },
        },
        required: false,
      },
      {
        model: GfClient,
        as: 'client',
        required: false,
      },
      {
        model: GfContract,
        as: 'contract',
        required: false,
        include: [
          {
            model: GfIncidence,
            as: 'open_incidences',
            required: false,
          },
          {
            model: GfContract,
            as: 'linkedContract',
            required: false,
          },
        ],
      },
    ],
  });

  if (!crmTask) {
    return respondNotFound(`crm task with id ${id} not found`);
  }

  return respondSuccess(crmTask);
};

exports.getMyTask = async (query, task_types, userId) => {
  const customQuery = {
    taskTypeId: JSON.parse(task_types ? task_types : '[]'),
    executed: '0',
  };
  if (!task_types) delete customQuery.taskTypeId;
  return getAllEntities(query, CrTask, customQuery, [
    {
      model: CrTaskType,
      as: 'task_type',
      where: { executable: 1 },
    },
    {
      model: CrTaskExtraFieldXref,
      as: 'extra_fields',
      include: {
        model: CrTaskExtraField,
        as: 'extra_field',
        required: false,
      },
      required: false,
    },
    {
      model: CrTaskUserXref,
      as: 'users',
      include: {
        model: CrmUser,
        as: 'user',
        required: false,
      },
      where: { userId },
    },
    {
      model: GfClient,
      as: 'client',
      required: false,
    },
    {
      model: GfContract,
      as: 'contract',
      required: false,
      include: {
        model: GfFeeGroup,
        as: 'fee_group',
        include: {
          model: GfSection,
          as: 'sections',
          required: false,
        },
        required: false,
      },
    },
  ]);
};

/**
 *
 * add a crm task record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postCrmTasks = async function (body, creator_id, logedUserId) {
  body.previsionDate = body.previsionDate
    ? body.previsionDate
    : moment().format('YYYY-MM-DD HH:mm:ss');

  if (
    body.previsionDate2 &&
    moment(body.previsionDate).isAfter(body.previsionDate2)
  )
    return respondBadRequest(`init date is after end date`);

  body = CrmTaskHelperService.normalizeData(body);
  if (
    !(await CrmTaskHelperService.isValidUsers(body.crm_users)) ||
    !(await CrmTaskHelperService.isValidExtraFields(body.extra_fields))
  ) {
    return respondBadRequest(`user or extra fields is wrong`);
  }

  const taskType = await CrTaskType.findByPk(body.taskTypeId);
  if (!taskType)
    return respondNotFound(`task type with id ${body.taskTypeId} not found`);

  if (
    taskType.forcePrevisionInFuture &&
    taskType.executable &&
    body.executed === '0' &&
    moment(body.previsionDate).startOf('day').isBefore(moment().startOf('day'))
  ) {
    return respondBadRequest(
      'Prevision Date must be greater or equal to today',
    );
  }

  body.userId = creator_id;
  const newCrTask = await CrTask.create(body);
  CrmTaskHelperService.recordLog(newCrTask, 'insert', creator_id);

  // insert related data
  await CrmTaskHelperService.attachUsersToEvent(body.crm_users, newCrTask.id);
  await CrmTaskHelperService.attachExtraFieldToEvent(
    body.extra_fields,
    newCrTask.id,
  );

  if (!newCrTask.chatId || newCrTask.chatId === 'crmTask:') {
    newCrTask.chatId = `crmTask:${newCrTask.id}`;
    await newCrTask.save();
  }

  if (newCrTask.text) {
    await MessageService.sendMessage(
      newCrTask.text,
      newCrTask.chatId,
      creator_id,
      creator_id,
    );
  }

  if (newCrTask.aditionalText) {
    await MessageService.sendMessage(
      newCrTask.aditionalText,
      newCrTask.chatId,
      creator_id,
      creator_id,
    );
  }

  const resultOfCreateTask =
    await CrmTaskHelperService.createTasksTaskFromChild(newCrTask.id);
  if (resultOfCreateTask.success) {
    newCrTask.rTaskId = resultOfCreateTask.task.id;
    await newCrTask.save();
  }

  const crmTaskWithRelatedData = await CrTask.findByPk(newCrTask.id, {
    include: [
      {
        model: CrTaskUserXref,
        as: 'users',
        required: false,
        include: { model: CrmUser, as: 'user', required: false },
      },
      { model: CrTaskType, as: 'task_type' },
      { model: InvoiceClient, as: 'invoice_client' },
      { model: GfClient, as: 'client', required: false },
    ],
  });
  await CrmTaskHelperService.setNotification({
    crmTask: crmTaskWithRelatedData,
    logedUserId,
  });
  await CrmGoogleService._syncEvent({ eventId: newCrTask.id }, creator_id);
  return respondCreated(newCrTask);
};

/**
 *
 * update a crm task record by id
 *
 * id String
 * returns Object
 **/
exports.putCrmTasksId = async function (id, body, user_update_id, logedUserId) {
  //task type not updatable
  delete body.taskTypeId;

  const oldCrmTaskModel = await CrTask.findByPk(id);
  if (!oldCrmTaskModel) {
    return respondNotFound(`crm-task with id ${id} not found`);
  }

  if (
    !(await CrmTaskHelperService.isValidUsers(body.crm_users)) ||
    !(await CrmTaskHelperService.isValidExtraFields(body.extra_fields))
  ) {
    return respondBadRequest(`user or extra fields is wrong`);
  }

  const taskType = await CrTaskType.findByPk(oldCrmTaskModel.taskTypeId);
  if (
    taskType.forcePrevisionInFuture &&
    taskType.executable &&
    body.executed === '0' &&
    moment(body.previsionDate).startOf('day').isBefore(moment().startOf('day'))
  ) {
    return respondBadRequest(
      'Prevision Date must be greater or equal to today',
    );
  }

  const oldCrmTask = modelToJson(oldCrmTaskModel);
  let doExecute = 0;
  if (!parseInt(oldCrmTask.executed) && parseInt(body.executed)) {
    body.executed = '0';
    doExecute = 1;
  }

  body = CrmTaskHelperService.normalizeData(body);

  if (!body.chatId && oldCrmTask.chatId === 'crmTask:') {
    body.chatId = `crmTask:${oldCrmTask.id}`;
  }

  if (body.executed === '') {
    body.executed = '0';
  }

  await findAndUpdate(id, body, CrTask);
  const crmTaskModel = await CrTask.findByPk(id);
  await CrmTaskHelperService.attachUsersToEvent(
    body.crm_users,
    crmTaskModel.id,
  );
  await CrmTaskHelperService.attachExtraFieldToEvent(
    body.extra_fields,
    crmTaskModel.id,
  );

  await exports.onAfterUpdateEvent(
    crmTaskModel,
    oldCrmTask,
    user_update_id,
    false,
    doExecute,
    'event',
  );

  const crmTaskWithRelatedData = await CrTask.findByPk(crmTaskModel.id, {
    include: [
      {
        model: CrTaskUserXref,
        as: 'users',
        required: false,
        include: { model: CrmUser, as: 'user', required: false },
      },
      { model: CrTaskType, as: 'task_type', required: false },
      { model: InvoiceClient, as: 'invoice_client', required: false },
      { model: GfClient, as: 'client', required: false },
    ],
  });
  await CrmTaskHelperService.setNotification({
    crmTask: crmTaskWithRelatedData,
    logedUserId,
  });
  return exports.getCrmTasksId(id);
};

exports.onAfterUpdateEvent = async function (
  updatedTask,
  oldTask,
  creator_id,
  dont_trigger = false,
  doExecute = false,
  comeFrom = '',
) {
  CrmTaskHelperService.recordLog(updatedTask, 'update', creator_id);
  if (!dont_trigger && updatedTask.refererKey) {
    // update related entity
    switch (updatedTask.refererKey) {
      case 'GfCrm': {
        await GfCrmService.onEventUpdated(updatedTask, creator_id, comeFrom);
        break;
      }
      default:
        break;
    }

    if (parseInt(oldTask.executed) && !parseInt(updatedTask.executed)) {
      // deExecute
      switch (updatedTask.refererKey) {
        case 'GfCrm': {
          await GfCrmService.onEventDeExecuted(updatedTask, comeFrom);
          break;
        }
        default:
          break;
      }
      //add errors
    }
  }

  if (doExecute) {
    //execute
    await exports.setExecuted(updatedTask.id, '', null, creator_id, comeFrom);
  }

  //sync google calendar
  if (!dont_trigger) {
    await CrmGoogleService._syncEvent({ eventId: updatedTask.id }, creator_id);
  }
};

/**
 * @deprecated use setExecuted2
 */
exports.setExecuted = async (
  task_id,
  text = null,
  date = null,
  userId,
  comeFrom = '',
) => {
  return exports.tglExecute(
    task_id,
    text,
    date,
    1,
    false,
    userId,
    false,
    comeFrom,
  );
};

/**
 * better version of setExecuted with different function signature
 * @param {{
 *  taskId: number;
 *  text?: string;
 *  date?: any;
 *  userId?: number;
 *  ignoreTrigger?: boolean;
 * }} param0
 */
exports.setExecuted2 = async ({
  taskId,
  text,
  date,
  userId,
  ignoreTrigger,
  comeFrom,
}) => {
  return exports.tglExecute(
    taskId,
    text ?? null,
    date,
    1,
    ignoreTrigger ?? false,
    userId,
    comeFrom ?? '',
  );
};

exports.tglExecute = async (
  id,
  text,
  date,
  forceState,
  ignoreTriger = false,
  userId,
  response = false,
  comeFrom = '',
) => {
  const taskModel = await CrTask.findByPk(id);
  if (!taskModel) {
    return respondNotFound(`crm task with id ${id} not found`);
  }

  date = date ? date : moment().format('YYYY-MM-DD HH:mm:ss');

  if (
    (forceState === null || forceState === undefined) &&
    taskModel.executed == forceState
  ) {
    if (response)
      return respondSuccess({
        success: true,
        task: taskModel,
      });
    return {
      success: true,
      task: taskModel,
    };
  }

  if (taskModel.executed === '1') {
    taskModel.executed = '0';
    taskModel.executedDate = '0000-00-00 00:00:00';
  } else {
    taskModel.executed = '1';
    taskModel.executedDate = date;
  }

  let setTraceOld = false;
  let eventActionResult = null;
  if (!ignoreTriger && taskModel.executed === '1') {
    switch (taskModel.refererKey) {
      case 'GfCrm':
        eventActionResult = await GfCrmService.onEventExecuted(
          taskModel,
          userId,
          comeFrom,
        );
        if (!eventActionResult.success) {
          if (response)
            throw new errors.BadRequest(
              eventActionResult.reason
                ? eventActionResult.reason
                : eventActionResult,
            );
          return eventActionResult;
        }
        if (eventActionResult.setTraceOld === true) {
          setTraceOld = true;
        }
        break;
      default:
        break;
    }

    if (text) {
      MessageService.sendMessage(text, taskModel.chatId, 0, 0);
    }

    if (setTraceOld) {
      taskModel.refererTrace = `${taskModel.refererTrace}-ignore`;
    }
    await taskModel.save();
    CrmTaskHelperService.recordLog(taskModel, 'state', userId);

    //sync google calendar
    if (!ignoreTriger) {
      await CrmGoogleService._syncEvent({ eventId: id }, userId);
    }

    if (response)
      return respondSuccess({
        success: true,
        task: taskModel,
      });
  }
  await taskModel.save();
  return {
    success: true,
    row: taskModel,
  };
};

/**
 * filter roles of notification and check filter apply or no
 * @param {object} notificationData notification data to get preferences
 * @returns {object} status of preferences related to this user and notification
 */
exports.checkUserPreferences = async (notificationData) => {
  // getUserPreferences function:
  const preferences = await CrNotificationPreference.findAll({
    where: {
      userId: notificationData.userId,
      concept: notificationData.concept,
    },
    include: [
      {
        model: CrTaskExtraField,
        as: 'tags',
        required: false,
      },
      {
        model: CrmUser,
        as: 'users',
        required: false,
      },
      {
        model: CrTaskType,
        as: 'types',
        required: false,
      },
    ],
  });

  const event = await CrTask.findByPk(
    notificationData.aditionalPushData.taskId,
    {
      include: [
        {
          model: CrTaskType,
          as: 'task_type',
          required: false,
        },
        {
          model: CrTaskExtraFieldXref,
          as: 'extra_fields',
          required: false,
        },
        {
          model: CrTaskUserXref,
          as: 'users',
          include: {
            model: CrmUser,
            as: 'user',
          },
          required: false,
        },
      ],
    },
  );

  let checkPass = false;
  const reasons = {};
  const prUsed = {};

  for (const preference of preferences) {
    let execCheck = true;
    prUsed[preference.id] = false;
    if (event.task_type.executable) {
      if (event.executed === '1') {
        if (!preference.executed) execCheck = false;
      } else {
        if (!preference.noExecuted) execCheck = false;
      }
    } else {
      if (!preference.noExecutables) execCheck = false;
    }
    if (!execCheck) {
      reasons[preference.id] = `event state dont match`;
      continue;
    }

    if (
      !preference.tags.length &&
      !preference.users.length &&
      !preference.types.length
    ) {
      reasons[preference.id] = `all emty`;
      continue;
    }

    const prUsers = preference.users.map((user) => user.userId);
    if (prUsers && prUsers.length) {
      let ok = false;
      const eventUserIds = event.users.map(
        (crmUserXref) => crmUserXref.user.userId,
      );
      for (const prUser of prUsers) {
        if (eventUserIds.includes(parseInt(prUser))) {
          ok = true;
          break;
        }
      }
      if (!ok) {
        reasons[preference.id] = `user dont match`;
      }
    }

    const prTypes = preference.types.map((type) => type.id);
    if (prTypes && prTypes.length) {
      if (!prTypes.includes(`${event.taskTypeId}`)) {
        reasons[preference.id] = `type dont match`;
        continue;
      }
    }

    const prTags = preference.tags.map((tag) => tag.id);
    if (prTags && prTags.length) {
      let ok = true;
      const eventTagIds = event.extra_fields.map((tag) => tag.extraFieldId);
      for (const tagId of prTags) {
        if (!eventTagIds.includes(tagId)) {
          ok = false;
          break;
        }
      }
      if (!ok) {
        reasons[preference.id] = `tag no present`;
        continue;
      }
    }

    checkPass = true;
    prUsed[preference.id] = true;
  }

  return {
    success: true,
    checkPass,
    usedRules: prUsed,
    reasons,
    preferences,
    data: notificationData,
  };
};

/**
 * get task information related to notification
 * @param {number} notificationId
 * @returns {Promise<object>}
 */
exports.getTaskInfoByNotification = async (notificationId) => {
  const notification = await GlobalNotificationsHistory.findByPk(
    notificationId,
  );
  const taskId = JSON.parse(notification.metadata).taskId;
  const task = await CrTask.findByPk(taskId, {
    include: { model: GfClient, as: 'client' },
  });
  const externalInfo = {};
  const refererMetadata = JSON.parse(
    task.refererMetadata ? task.refererMetadata : '{}',
  );
  externalInfo.clientId = task.client.id;
  externalInfo.invoiceClientId = task.client.invoiceClientId;
  if (_.get(refererMetadata, 'assistance', false))
    externalInfo.assistanceId = Number(refererMetadata.assistanceId);
  else if (_.get(refererMetadata, 'incidence', false))
    externalInfo.incidenceId = Number(task.refererMetadata.incidenceId);
  else externalInfo.taskId = task.id;
  return respondSuccess(externalInfo);
};
