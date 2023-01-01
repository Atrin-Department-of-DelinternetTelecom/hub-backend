// @ts-check
'use strict';

const {
  intranet: {
    CrTask,
    CrTaskType,
    CrTaskLog,
    CrChat,
    TasksFlux,
    TasksTask,
    CrTaskExtraField,
    CrTaskExtraFieldXref,
    CrTaskUserXref,
    GfContract,
    GfCrmEvent,
    InvoiceClientExtraFieldXref,
    CrmUser,
    GfTaskContractXref,
    GfInvoiceInvoice,
    InvoiceClient,
    CrNotificationPreference,
  },
  AnyModel,
} = require('@models');

const { User } = require('@models').system;
const config = require('@config');
const ejs = require('ejs');
const fs = require('fs');
const moment = require('moment');
const path = require('path');
const _ = require('lodash');
const { respondBadRequest } = require('@utils/response');
const GfCollaboratorService = require('./GfCollaboratorService');
const CrmBonusService = require('./CrmBonusService');
const { sendMessage, publishNewMessage } = require('./MessageService');
const { getTypeByTag } = require('./CrmTaskTypeService');
const { modelToJson } = require('@utils/tools');
const OneTimeService = require('./OneTimeService');
const CrmGoogleService = require('./CrmGoogleService');
const notificationService = require('./NotificationService');
const invoiceClientService = require('./InvoiceClientService');
const CrmNotificationsPreferenceService = require('./CrmNotificationsPreferenceService');
const hbs = require('express-handlebars');
const assert = require('assert');
const { GfClient } = require('@api/models/intranet/intranet_gf_clients');
const GfContractSectionStatusService = require('./GfContractSectionStatusService');
const { getActualConditions } = require('./Fee/GfFeeService');
const {
  GfCellProviderFee,
} = require('@api/models/intranet/intranet_gf_cell_providers_fees');
const {
  GfCellProvider,
} = require('@api/models/intranet/intranet_gf_cell_providers');
const { SERVICE } = require('@api/constants/contracts');

const templates = config.get('index.templates');

const handlebars = hbs.create({
  layoutsDir: path.resolve('@template'),
});

exports.getTaskByTrace = async (trace) => {
  return CrTask.findOne({
    where: {
      refererTrace: trace,
    },
    include: [
      {
        model: CrmUser,
        as: 'creator',
        required: false,
      },
      {
        model: CrTaskUserXref,
        as: 'users',
        required: false,
      },
    ],
  });
};

exports.markAsCanceled = async (trace) => {
  await exports.maskAsCanceled(trace);

  // remove on time create block event
  await OneTimeService.unMark('global', trace);
  return {
    success: true,
  };
};

exports.maskAsCanceled = async (trace) => {
  const task = await CrTask.findOne({
    where: {
      refererTrace: [trace, `${trace}-ignore`],
    },
  });

  if (!task) throw new Error(`task with refererTrace ${trace} not found`);

  if (task.refererTrace !== trace) return;

  task.aditionalText = `<div class='alert alert-danger'>Cancelada</div> ${task.aditionalText}`;
  task.executed = '1';
  task.canceled = 1;
  task.refererTrace = `${trace}-ignore`;
  await task.save();
};

/**
 *
 * @param {string} name
 * @param {number} contractId
 * @param {any} option
 * @param {string | null} sectionType
 * @param {string | null} keySufix
 * @param {number=} loginUserId
 * @returns
 */
exports.createFullEvent = async (
  name,
  contractId,
  option,
  sectionType = null,
  keySufix = null,
  loginUserId = 0,
) => {
  const validKeySufix = keySufix ? keySufix : contractId;
  const validSectionType = sectionType ? sectionType : `COMMON`;
  const key = option.useKey
    ? option.useKey
    : `${name}_${validKeySufix}_${validSectionType}`;
  if (option.onetime) {
    const exists = await exports.getTaskByTrace(key);
    if (exists) {
      return {
        success: true,
        reason: 'already exists',
        event: exists,
      };
    }
  }
  const contract = await GfContract.findByPk(contractId);
  const section = await GfContractSectionStatusService.findForContract(
    contractId,
  );
  const client = await getClient(option.clientId ?? contract?.clientId);
  const html = option.html
    ? option.html
    : await getHtml(name, {
        client,
        contract,
        section,
        option,
      });
  let motherChatId = undefined;
  if (option.motherTaskId) {
    motherChatId = (await CrTask.findByPk(option.motherTaskId))?.chatId;
  }

  const configs = await getConfigFor(
    `${name}/${validSectionType}`,
    Number(client.collaboratorId),
    loginUserId,
  );

  const conditions = contract
    ? await getActualConditions(contract?.feeGroupId)
    : { cellFee: 0 };
  const cellFee =
    section?.type === SERVICE.CELL
      ? await GfCellProviderFee.findByPk(conditions.cellFee, {
          include: [
            {
              model: GfCellProvider,
              as: 'provider',
            },
          ],
        })
      : undefined;

  let ret = null;
  for (const config of configs) {
    if (config.clientTags.length > 0) {
      let check = true;
      const clientTags = await InvoiceClientExtraFieldXref.findAll({
        where: {
          clientId: client.invoiceClientId,
          status: 1,
        },
      });
      if (config.clientTagsAnd) {
        check = true;
        for (const tag of clientTags) {
          const found = clientTags.some((el) => el.extraFieldId === tag);
          if (!found) {
            check = false;
          }
        }
      } else {
        check = false;
        for (const tag of clientTags) {
          const found = clientTags.some((el) => el.extraFieldId === tag);
          if (!found) {
            check = true;
          }
        }
      }
      if (!check) {
        continue;
      }
    }
    let subscribers = config.users;
    if (option.subscribers) {
      subscribers = subscribers.concat(option.subscribers);
    }
    option.metadata = option.metadata ? option.metadata : {};
    option.metadata.section = validSectionType;
    const previsionDate = option.previsionDate
      ? option.previsionDate
      : moment().format('YYYY-MM-DD HH:mm:ss');
    const duration = option.duration ? option.duration : 30;
    const subject = config.title ? config.title : option.subject;
    const chatId = motherChatId ? motherChatId : option.chatId;
    const motherTaskId = option.motherTaskId;

    ret = await createEvent(
      `createFullEvent/${name}`,
      client.invoiceClientId,
      cellFee ? `${subject} [${cellFee.provider?.code}]` : subject,
      html,
      config.type,
      previsionDate,
      config.extraFieldsIds,
      subscribers,
      option.metadata,
      key,
      duration,
      chatId,
      contractId,
      motherTaskId,
      loginUserId,
    );

    const isIncidence = name.split('/')[0] === `incidence`;

    // @ts-ignore
    if (isIncidence && ret.success && section.section.row.id) {
      let reference = null;
      switch (section.type) {
        case 'INTERNET':
          reference = `${section.section.row.id}::${section.section.row.guifiZona}`;
          break;
        case 'CELL':
          reference = section.section.row.number;
          break;
        case 'FIX':
          reference = section.section.row.number;
          break;
        default:
          break;
      }
      // @ts-ignore
      const taskId = ret.data.id;
      await GfTaskContractXref.create({
        contractId,
        taskId,
        initialText: option.text,
        reference,
        sla: conditions.internetSLAType,
      });
    }
  }

  return ret;
};

/**
 *
 * @param {number} clientId
 * @returns {Promise<GfClient>}
 */
const getClient = async (clientId = -1) => {
  if (!clientId) {
    return new GfClient({
      id: -1,
      invoiceClientId: -1,
      collaboratorId: 0,
    });
  }

  const client = await GfClient.findByPk(clientId);
  assert(
    client,
    `[CrmTaskHelperService][getClient] Client with id:${clientId} not found`,
  );

  return client;
};

const getConfigFor = async (
  reference,
  collaboratorId = 0,
  loginUserId = null,
) => {
  let gfCrmEvents = [];
  if (collaboratorId > 0) {
    gfCrmEvents = await GfCrmEvent.findAll({
      where: {
        reference,
        collaboratorId,
      },
    });
  }

  if (!gfCrmEvents.length) {
    const me = await GfCollaboratorService.getMyCollaborator(loginUserId);
    if (me && !me.master) {
      gfCrmEvents = await GfCrmEvent.findAll({
        where: {
          reference,
          collaboratorId: me.id,
        },
      });
    }
  }

  if (!gfCrmEvents.length) {
    gfCrmEvents = await GfCollaboratorService.selectIfNoSpecificCollaborator(
      reference,
    );
  }

  if (!gfCrmEvents.length) {
    const noteType = await getTypeByTag('note');
    const newGfCrmEvent = await GfCrmEvent.create({
      reference,
      type: noteType ? noteType.id : 4,
    });
    gfCrmEvents.push(newGfCrmEvent);
  }

  for (const index in gfCrmEvents) {
    const gfCrmEvent = await GfCollaboratorService.hydrateFor(
      modelToJson(gfCrmEvents[index]),
    );
    gfCrmEvent.users = gfCrmEvent.users.map((item) => item.userId);
    gfCrmEvent.extraFieldsIds = gfCrmEvent.extraFieldsIds.map(
      (item) => item.id,
    );
    gfCrmEvent.clientTags = gfCrmEvent.clientTags.map(
      (item) => item.extraFieldId,
    );
    gfCrmEvents[index] = gfCrmEvent;
  }
  return gfCrmEvents;
};

const getHtml = async (template, data) => {
  data.option.aditionalInfo = data.option.aditionalInfo
    ? data.option.aditionalInfo
    : {};
  let templateName = `${template}.ejs`;
  if (!fs.existsSync(path.resolve(templates, `event`, templateName))) {
    templateName = `default.ejs`;
  }
  const result = await ejs.renderFile(
    path.resolve(templates, `event`, templateName),
    data,
  );
  return result;
};

const createEvent = async (
  func,
  clientId,
  title,
  text,
  typeId,
  previsionDate,
  extraFieldsIds = [],
  subscribersIds = [],
  metadata = null,
  trace,
  duration,
  chatId,
  contractId,
  motherTaskId,
  userId,
) => {
  const meta = metadata ? metadata : {};
  meta.function = func;
  const crmIdsOfSubscribers = await getCrmIdsOfSubscriberIds(subscribersIds);
  const newTaskData = {
    userId,
    clientId,
    alias: title,
    text: '',
    aditionalText: text,
    taskTypeId: typeId,
    previsionDate,
    previsionDate2: moment(previsionDate)
      .add(duration, 'minutes')
      .format('YYYY-MM-DD HH:mm:ss'),
    refererKey: 'GfCrm',
    refererMetadata: meta,
    refererTrace: trace,
    chatId,
    altId: contractId,
    altIdType: contractId ? 'gf_contracts' : '',
    motherTaskId,
  };
  return await createExternalEvent(
    newTaskData,
    extraFieldsIds,
    crmIdsOfSubscribers,
    userId,
  );
};

const getCrmIdsOfSubscriberIds = async (subscribersIds) => {
  const crmUsers = await CrmUser.findAll({
    where: {
      userId: subscribersIds,
    },
    attributes: ['id'],
  });
  return crmUsers.map((item) => item.id);
};

const createExternalEvent = async (
  task,
  extra_fields,
  subscribers,
  creator_id,
) => {
  try {
    const newBody = exports.normalizeData(task);
    if (
      !(await exports.isValidUsers(subscribers)) ||
      !(await exports.isValidExtraFields(extra_fields))
    ) {
      return respondBadRequest(`user or extra fields is wrong`);
    }
    newBody.userId = creator_id;
    const newCrTask = await CrTask.create(newBody);
    exports.recordLog(newCrTask, 'insert', creator_id);

    // insert related data
    await exports.attachUsersToEvent(subscribers, newCrTask.id);
    await exports.attachExtraFieldToEvent(extra_fields, newCrTask.id);

    if (!newCrTask.chatId || newCrTask.chatId === 'crmTask:') {
      newCrTask.chatId = `crmTask:${newCrTask.id}`;
      await newCrTask.save();
    }

    if (newCrTask.text) {
      await sendMessage(
        newCrTask.text,
        newCrTask.chatId,
        creator_id,
        creator_id,
      );
    }

    if (newCrTask.aditionalText) {
      await sendMessage(
        newCrTask.aditionalText,
        newCrTask.chatId,
        creator_id,
        creator_id,
      );
    }

    const resultOfCreateTask = await exports.createTasksTaskFromChild(
      newCrTask.id,
    );
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
          include: [{ model: CrmUser, as: 'user', required: false }],
        },
        { model: CrTaskType, as: 'task_type' },
        { model: InvoiceClient, as: 'invoice_client' },
        { model: GfClient, as: 'client' },
      ],
    });

    const systemUser = await User.findOne({ where: { user_id: creator_id } });
    await exports.setNotification({
      crmTask: crmTaskWithRelatedData,
      logedUserId: _.get(systemUser, 'id', 1),
    });

    await CrmGoogleService._syncEvent({ eventId: newCrTask.id }, creator_id);
    return newCrTask;
  } catch (error) {
    /** @type {any} */
    error.type = 'crm_task_process';
    error.crmTask = task;
    throw error;
  }
};

exports.isValidUsers = async (users) => {
  if (users && Array.isArray(users)) {
    const allUsersCount = await CrmUser.count({ where: { id: users } });
    if (allUsersCount === users.length) {
      return true;
    }
    return false;
  }
  return true;
};

exports.createTasksTaskFromChild = async (refererId) => {
  const crTask = await CrTask.findByPk(refererId);
  if (!crTask)
    return {
      success: false,
      reason: `Error retrieving eventId = ${refererId}`,
    };

  const type = await CrTaskType.findByPk(crTask.taskTypeId);
  if (type.rTaskFluxId <= 0)
    return {
      success: false,
      reason: `Task type with no fluixId defined`,
    };

  const text = crTask.aditionalText ? crTask.aditionalText : crTask.text;
  return await createTasksTaskFromParrent(
    refererId,
    {
      description: text,
      alias: crTask.alias,
    },
    type.rTaskFluxId,
  );
};

const createTasksTaskFromParrent = async (
  refererId,
  extendRow = {},
  fluxId = null,
  called_by,
) => {
  const currentFluxId = fluxId ? fluxId : called_by.fluxId;
  const refererKey = called_by.refererKey;
  if (!refererKey)
    return {
      success: false,
      reason: 'refererKey not set',
    };

  if (!refererId)
    return {
      success: false,
      reason: `refererId not supplied (${refererKey})`,
    };

  if (currentFluxId <= 0)
    return {
      success: false,
      reason: `fluxId no supplied (${refererKey})`,
    };

  const flux = await TasksFlux.findByPk(currentFluxId);
  if (!flux)
    return {
      success: false,
      reason: `Flux not found (${currentFluxId})`,
    };

  const tasksTask = await TasksTask.findOne({
    where: {
      refererId,
      refererKey,
    },
  });
  if (!tasksTask)
    return {
      success: true,
      task: tasksTask,
    };

  const newTask = await TasksTask.create({
    refererId,
    refererKey,
    fluxId: currentFluxId,
    alias: extendRow.alias,
    description: extendRow.description,
    stateId: flux.initialStateId,
  });
  return {
    success: true,
    task: newTask,
    isNewTask: true,
  };
};

exports.recordLog = async (data, action, creator_id) => {
  return CrTaskLog.create({
    userId: creator_id,
    action,
    text: data.text,
    taskId: data.id,
    executed: ['in_progress', '0'].includes(data.executed) ? 0 : 1,
  });
};

exports.isValidExtraFields = async (extra_fields) => {
  if (extra_fields && Array.isArray(extra_fields)) {
    const extraFieldsCount = await CrTaskExtraField.count({
      where: { id: extra_fields },
    });
    if (extraFieldsCount === extra_fields.length) {
      return true;
    }
    return false;
  }
  return true;
};

/**
 * check some property and add some extra data based on props
 *
 * @param {object} body => {allDay,previsionDate2,previsionDate,executedDate,refererMetadata}
 * @return {object} updated body
 */
exports.normalizeData = (body) => {
  if (body.previsionDate2) {
    body.duration = body.allDay
      ? 0
      : (moment(body.previsionDate2).valueOf() -
          moment(body.previsionDate).valueOf()) /
        (1000 * 60);
  }

  if (body.executed === '1') {
    body.executedDate = body.executedDate
      ? body.executedDate
      : moment().format('YYYY-MM-DD HH:mm:ss');
  }

  if (body.refererMetadata) {
    body.refererMetadata = JSON.stringify(body.refererMetadata);
  }

  return body;
};

/**
 * sync new user attached to this event
 * @param {object} newUser
 * @param {number} event_id
 */
exports.attachUsersToEvent = async (newUser, event_id) => {
  if (newUser && Array.isArray(newUser)) {
    const taskUsers = await CrTaskUserXref.findAll({
      where: {
        taskId: event_id,
      },
    });

    const usersRelatedToThisTask = taskUsers.map((taskUser) => taskUser.userId);
    const usersShouldAdd = newUser.filter(
      (new_user_id) => !usersRelatedToThisTask.includes(new_user_id),
    );
    const usersShouldRemove = usersRelatedToThisTask.filter(
      (user_id) => !newUser.includes(user_id),
    );
    await CrTaskUserXref.update(
      {
        status: 0,
      },
      {
        where: {
          userId: usersShouldRemove,
          taskId: event_id,
        },
      },
    );
    await CrTaskUserXref.bulkCreate(
      usersShouldAdd.map((userId) => {
        return {
          userId,
          taskId: event_id,
        };
      }),
    );
  }
};

exports.attachExtraFieldToEvent = async (new_extra_fields, event_id) => {
  if (new_extra_fields && Array.isArray(new_extra_fields)) {
    const current_extra_fields = await CrTaskExtraFieldXref.findAll({
      where: {
        taskId: event_id,
      },
    });
    const extraFieldsRelatedToThisTask = current_extra_fields.map(
      (taskExtraField) => taskExtraField.extraFieldId,
    );
    const extraFieldsShouldAdd = new_extra_fields.filter(
      (new_extra_field_id) =>
        !extraFieldsRelatedToThisTask.includes(new_extra_field_id),
    );
    const extraFieldsShouldRemove = extraFieldsRelatedToThisTask.filter(
      (extra_field_id) => !new_extra_fields.includes(extra_field_id),
    );

    await CrTaskExtraFieldXref.update(
      {
        status: 0,
      },
      {
        where: {
          extraFieldId: extraFieldsShouldRemove,
          taskId: event_id,
        },
      },
    );
    await CrTaskExtraFieldXref.bulkCreate(
      extraFieldsShouldAdd.map((extraFieldId) => {
        return {
          extraFieldId,
          taskId: event_id,
        };
      }),
    );
  }
};

exports.setTaskIgnored = async function (refererTrace) {
  const task = await CrTask.findOne({
    where: {
      refererTrace,
    },
  });

  if (task === null) return `not found ("${refererTrace}")`;

  await task.update({
    refererTrace: `${refererTrace}-ignore`,
  });

  // delete ontime
  await OneTimeService.unMark('global', refererTrace);

  return task.id;
};

exports.eventExists = async function (refererTrace) {
  return await CrTask.findOne({
    where: {
      refererTrace: refererTrace,
    },
  });
};

exports.errorBono = async function (xrefId, userId) {
  return await CrmBonusService.errorBono(xrefId, userId);
};

exports.installBono = async function (xrefId, userId) {
  return await CrmBonusService.installBono(xrefId, userId);
};

exports.uninstallBono = async function (xrefId, userId) {
  return await CrmBonusService.uninstallBono(xrefId, userId);
};

/**
 *
 * @param {AnyModel} unpaidInvoice
 * @param {'unpaid' | 'paid' | 'cut' | 'sms'} type
 * @param {object=} user
 * @param {{ phone: string, sendDate?: Date,  via?: string }=} additionalData
 * @returns {Promise<number>}
 */
exports.saveUnpaidTaskForNotify = async function (
  unpaidInvoice,
  type = 'sms',
  user,
  additionalData,
) {
  // find from invoice_invoices table by
  // passed where condition
  // here will be {invoice_id: id}
  const gfInvoice = await GfInvoiceInvoice.findByPk(unpaidInvoice.invoice_id);

  // convert it to literal object
  const gfInvoicePlain = gfInvoice.get({ plain: true });

  const userId = user?.userId ?? 0;

  const client = await GfClient.findByPk(unpaidInvoice.client_id);
  const clientName = client?.name ?? gfInvoice.clientName;

  // render template by passed information
  const renderedText = await renderUnpaidText(type, {
    ...gfInvoicePlain,
    ...JSON.parse(JSON.stringify(unpaidInvoice)),
    ...additionalData,
    cutDate: unpaidInvoice.cut_date,
    userName: user?.name ?? 'system',
    unpaidFee: unpaidInvoice.unpaid_fee ?? 7.5,
    clientName,
  });

  // if it's the first time to
  // create event so we will create new one
  if (!unpaidInvoice?.event_id) {
    const newCrmEventModel = await CrTask.create({
      taskTypeId: 74,
      userId,
      clientId: gfInvoicePlain.clientId,
      alias: 'factura impaga',
      aditionalText: renderedText,
      status: 1,
      uid: 90,
    });
    newCrmEventModel.chatId = `crmTask:${newCrmEventModel.id}`;
    await newCrmEventModel.save();
    if (unpaidInvoice) {
      unpaidInvoice.event_id = newCrmEventModel.id;
      await unpaidInvoice.save();
    }
    return newCrmEventModel.id;
  } else {
    //else we will update older one event (task)
    const event = await CrTask.findByPk(unpaidInvoice.event_id);
    assert(event, 'Event not found in [saveUnpaidTaskForNotify]');
    if (type === 'paid') {
      event.taskTypeId = 111;
      await event.save();
    }
    const message = {
      text: renderedText,
      fromUserId: userId,
      filter: event.chatId,
    };
    const newChat = await CrChat.create(message);
    await publishNewMessage(newChat.id);
    return newChat.id;
  }
};

/**
 *
 * @param {'unpaid' | 'paid' | 'cut' | 'sms'} type
 * @param {{
 *  id: number,
 *  code: string,
 *  cutDate: Date,
 *  total: number,
 *  userName: string,
 *  sendDate: Date,
 *  phone: string,
 *  clientName: string,
 *  unpaidFee: string,
 *  via: string,
 * }} data
 * @returns
 */
const renderUnpaidText = async (type, data) => {
  const templates = config.get('index.templates');

  // TODO(erfan): this can be safely removed
  if (!['unpaid', 'paid', 'cut'].includes(type)) {
    type = 'sms';
  }

  return await handlebars.render(
    path.resolve(templates, `${type}.handlebars`),
    data,
  );
};

/**
 * set intranet notification after insert,update and delete a task
 * (crmTask must included with crmTaskType,invoiceClient,crmUser and client entities)
 * @param {{
 *  crmTask:object,
 *  dontRefreshClients?: boolean,
 *  userId?: number|null
 *  logedUserId?: number|null
 * }} param0
 *
 * @return {Promise<{success:boolean}>}
 */
exports.setNotification = async ({
  crmTask,
  dontRefreshClients = false,
  userId = null,
  logedUserId = null,
}) => {
  const keyPrefix = `crm/new_event_ssigned/${crmTask.id}/`;
  if (!crmTask.status) {
    const notifications = await notificationService.getNotiIdsByUniqueIdLike(
      keyPrefix,
    );
    await notificationService.setRead(
      notifications,
      false,
      dontRefreshClients,
      logedUserId,
    );
    return { success: true };
  }

  const text = `${crmTask.aditionalText ? crmTask.aditionalText : ''}${
    crmTask.text ? crmTask.text : ''
  }`;
  const length =
    Array.isArray(crmTask.users) && crmTask.users.length
      ? crmTask.users.length - 1
      : 0;
  const textVars = {
    userName: _.get(crmTask, `users[${length}].nickName`, 'no name'),
    alias: crmTask.alias,
    title: `${
      crmTask.alias
    }<br><b style='font-size:.8em;'>${invoiceClientService.getStringName(
      crmTask.invoice_client,
    )}</b></br>`,
    clientName: invoiceClientService.getStringName(crmTask.invoice_client),
    text,
    link: `http://www.delinternet.com/switch/#${Buffer.from(
      `FORMLOAD[:]formCrmTasks[:]${crmTask.id}[:]-99`,
      'base64',
    )}`,
  };

  //get notificationPreference related to subscribers of crm task
  const finalSubscriber = {};
  const userIdOfSubscribers = (
    await CrTaskUserXref.findAll({
      where: { taskId: crmTask.id, status: [0, 1] },
      include: {
        model: CrmUser,
        as: 'user',
      },
    })
  ).map((userXref) => {
    if (userXref.user.status) finalSubscriber[userXref.user.userId] = true;
    return userXref.user.userId;
  });

  (
    await CrmNotificationsPreferenceService.selectUsersSuscribedToUserid(
      userIdOfSubscribers,
      'new_event_ssigned',
    )
  ).forEach((userId) => {
    finalSubscriber[userId] = true;
  });

  // send notification for creator of this notification preference
  const preference = await CrNotificationPreference.findOne({
    where: { concept: 'new_event_ssigned' },
  });
  preference ? (finalSubscriber[preference.userId] = true) : null;

  if (userId && finalSubscriber[userId]) {
    // @ts-ignore
    await notificationService.sendArray({
      userId,
      concept: 'new_event_ssigned',
      app: 'crm',
      textVars,
      icon: {
        cls: crmTask.task_type.icon,
        style: `background-color: ${crmTask.task_type.icon}`,
      },
      aditionalPushData: {
        key: 'newCrmEvent',
        refererTrace: crmTask.refererTrace,
        refererMetadata: crmTask.refererMetadata,
        taskId: crmTask.id,
        clientId: crmTask.clientId,
        internalClientId: crmTask.client.id,
        chatId: crmTask.chatId,
        previsionDate: crmTask.previsionDate,
      },
      uniqueId: `${keyPrefix}${userId ? userId : ''}`,
      dontRefreshClients,
      logedUserId,
    });
    return { success: true };
  }

  for (const subscriberUserId in finalSubscriber) {
    // @ts-ignore
    await notificationService.sendArray({
      userId: subscriberUserId,
      concept: 'new_event_ssigned',
      app: 'crm',
      textVars,
      icon: {
        cls: crmTask.task_type.icon,
        style: `background-color: ${crmTask.task_type.icon}`,
      },
      aditionalPushData: {
        key: 'newCrmEvent',
        refererTrace: crmTask.refererTrace,
        refererMetadata: crmTask.refererMetadata,
        taskId: crmTask.id,
        clientId: crmTask.clientId,
        internalClientId: crmTask.client.id,
        chatId: crmTask.chatId,
        previsionDate: crmTask.previsionDate,
      },
      uniqueId: `${keyPrefix}${subscriberUserId}`,
      dontRefreshClients,
      logedUserId,
    });
  }
  return { success: true };
};
