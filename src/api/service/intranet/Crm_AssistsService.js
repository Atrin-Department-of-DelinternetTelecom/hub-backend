'use strict';

const { GfAssist, GfUser, CrTaskUserXref, GfIncidence, CrmUser } =
  require('@models').intranet;

const moment = require('moment');

const CrmTaskHelperService = require('./CrmTaskHelperService');

const GfContractSectionStatusService = require('./GfContractSectionStatusService');

const GfContractService = require('./GfContractService');

const GfAssistService = require('./GfAssistService');

const CrmTaskService = require('./CrmTaskService');

const Incidences_GfIncidencesService = require('./Incidences_GfIncidencesService');

const { Op } = require('sequelize');

exports.newAssistance = async (assist, login_user_id, comeFrom = '') => {
  if (comeFrom === 'event') return { success: true };
  comeFrom = 'assist';
  await _checkWhatToDo(assist, login_user_id, comeFrom);
  Incidences_GfIncidencesService.checkIncidenceLabels(
    assist.incidenceId,
    login_user_id,
    comeFrom,
  );
};

exports.assistanceUpdated = async (
  assist,
  login_user_id,
  comeFrom = '',
  action = 'update',
) => {
  if (comeFrom === 'event') return { success: true };
  comeFrom = 'assist';
  await _checkWhatToDo(assist, login_user_id, comeFrom, action);
  await Incidences_GfIncidencesService.checkIncidenceLabels(
    assist.incidenceId,
    login_user_id,
    comeFrom,
  );
};

const _checkWhatToDo = async (
  assist,
  login_user_id = null,
  comeFrom = '',
  action = 'update',
) => {
  const key = await GfAssistService.getAssistanceTrace(assist);
  const agendationTrace = key.replace(`_assist`, `_agendation`);
  const installationTrace = key;

  let agendationEvent = await CrmTaskHelperService.getTaskByTrace(
    agendationTrace,
  );
  let assistEvent = await CrmTaskHelperService.getTaskByTrace(
    installationTrace,
  );

  let state = '';
  let mainEvent = '';

  if (assist.closed) {
    state = `allDone`;
    mainEvent = `assist`;
  }
  if (
    state === '' &&
    (!assist.previsionDate ||
      !moment(assist.previsionDate).isValid() ||
      !assist.gfUserId)
  ) {
    state = `agendationPending`;
    mainEvent = `agendation`;
  }

  if (state === '' && !assist.closed) {
    state = `assistPending`;
    mainEvent = `assist`;
  }

  if (state === '') {
    return {
      success: false,
      error: 'No state found on _checkWhatToDo',
    };
  }

  // what we have to do based on state and event

  let ignoreTitle = false;

  switch (state) {
    case `agendationPending`:
      if (!agendationEvent) {
        ignoreTitle = true;
        await agendation(assist, login_user_id);
      } else {
        await CrmTaskService.tglExecute(
          agendationEvent.id,
          null,
          null,
          0,
          false,
          login_user_id,
          false,
          comeFrom,
        );
      }

      if (assistEvent) {
        await CrmTaskHelperService.maskAsCanceled(installationTrace);
      }
      break;
    case `assistPending`:
      if (agendationEvent && !agendationEvent.executed === '1') {
        await CrmTaskService.tglExecute(
          agendationEvent.id,
          null,
          null,
          1,
          false,
          login_user_id,
          false,
          comeFrom,
        );
      }

      if (!assistEvent) {
        ignoreTitle = true;
        await assistFunc(assist.id, login_user_id);
      }
      break;
    case `allDone`:
      if (agendationEvent && agendationEvent.executed !== '1') {
        await CrmTaskService.tglExecute(
          agendationEvent.id,
          null,
          null,
          1,
          false,
          login_user_id,
          false,
          comeFrom,
        );
      }

      if (assistEvent && assistEvent.executed !== '1') {
        await CrmTaskService.tglExecute(
          assistEvent.id,
          null,
          null,
          1,
          false,
          login_user_id,
          false,
          comeFrom,
        );
      }
      break;
    default:
      break;
  }

  agendationEvent = await CrmTaskHelperService.getTaskByTrace(agendationTrace);
  assistEvent = await CrmTaskHelperService.getTaskByTrace(installationTrace);

  if (agendationEvent) {
    await _syncAgendationEvent(
      agendationEvent,
      assist,
      mainEvent === 'agendation' && !ignoreTitle && mainEvent === 'agendation'
        ? assist.title
        : '',
      login_user_id,
      comeFrom,
    );
  }

  if (assistEvent) {
    await _syncAssistEvent(
      assistEvent,
      assist,
      login_user_id,
      comeFrom,
      action,
    );
  }

  return {
    success: true,
  };
};

const agendation = async (assist, login_user_id = null) => {
  let assistModel = assist;
  if (typeof assist !== 'object') {
    assistModel = await GfAssist.findByPk(assist);
  }

  const section = await GfContractSectionStatusService.findForContract(
    assistModel.contractId,
  );
  let chatId = null;
  if (assistModel.incidenceId > 0) {
    const incidence = await GfIncidence.findByPk(assistModel.incidenceId);
    const trace = await Incidences_GfIncidencesService.getIncidenceTrace(
      incidence,
      section.type,
    );
    const incidecneEvent = await CrmTaskHelperService.getTaskByTrace(trace);
    chatId = incidecneEvent.chatId;
  }

  let sufix = '';
  if (section.type === 'INTERNET') {
    const condition = await GfContractService.getActualConditionsBySection(
      assistModel.contractId,
    );
    const technology = condition.internetTechnology;
    sufix = `/${technology}`;
  }

  return CrmTaskHelperService.createFullEvent(
    `assist_agendation${sufix}`,
    assistModel.contractId,
    {
      subject: `Schedule client assist ${
        assistModel.alias ? `(${assistModel.alias})` : ''
      }`,
      text: `<b> You must assign an user and a date for client assist</b><br><br>${assistModel.description}<br><br>`,
      metadata: {
        action: 'assistAgendationDone',
        contractId: assistModel.contractId,
        assistanceId: assistModel.id,
        assistance: true,
      },
      previsionDate: moment().format('YYYY-MM-DD HH:mm:ss'),
      subscribers: null,
      duration: assistModel.duration,
      rightButtonsHtml: `<button class='btn btn-xs btn-defualt formGfAssists' data-id='${assistModel.id}'>Assistance <i class='fa fa-chevron-right'></i></button>`,
      onetime: true,
      chatId,
      motherTaskId: assistModel.motherEventId,
    },
    section.type,
    assistModel.id,
    login_user_id,
  );
};

const assistFunc = async (assist, creator_id = null) => {
  let assistModel = assist;
  if (typeof assist !== 'object') {
    assistModel = await GfAssist.findByPk(assist);
  }

  const user = await GfUser.findByPk(assistModel.gfUserId);
  const userToSubscribe = [user.userId];
  if (creator_id && !userToSubscribe.includes(creator_id)) {
    userToSubscribe.push(creator_id);
  }

  const section = await GfContractSectionStatusService.findForContract(
    assistModel.contractId,
  );
  let chatId = null;

  if (assistModel.incidenceId) {
    const incidence = await GfIncidence.findByPk(assistModel.incidenceId);
    const trace = await Incidences_GfIncidencesService.getIncidenceTrace(
      incidence,
      section.type,
    );
    const incidenceEvent = await CrmTaskHelperService.getTaskByTrace(trace);
    chatId = incidenceEvent.chatId;
  }

  let sufix = '';
  if (section.type === 'INTERNET') {
    const conditions = await GfContractService.getActualConditionsBySection(
      assistModel.contractId,
    );
    const technology = conditions.internetTechnology;
    sufix = `/${technology}`;
  }

  return CrmTaskHelperService.createFullEvent(
    `assist_assist${sufix}`,
    assistModel.contractId,
    {
      subject: `Assistance ${
        assistModel.alias ? `(${assistModel.alias})` : ''
      }`,
      text: `<b>${assistModel.description} </b><br><br>`,
      metadata: {
        action: 'assistanceDone',
        contractId: assistModel.contractId,
        assistanceId: assistModel.id,
        assistance: true,
      },
      previsionDate: moment(assistModel.previsionDate).format(
        'YYYY-MM-DD HH:mm:ss',
      ),
      duration: assistModel.duration,
      rightButtonsHtml: `<button class='btn btn-xs btn-defualt formGfAssists' data-id='${assistModel.id}'>Assistance <i class='fa fa-chevron-right'></i></button>`,
      onetime: true,
      subscribers: userToSubscribe,
      chatId,
      motherTaskId: assistModel.motherEventId,
    },
    section.type,
    assistModel.id,
    creator_id,
  );
};

const _syncAssistEvent = async (
  assistEvent,
  assist,
  login_user_id,
  comeFrom = '',
  action = 'update',
) => {
  // apply changes between assist and its related event and return boolean value if there is any change or not
  const changed =
    syncAssistAndEvent(assist, assistEvent) ||
    (await syncSubscriberOfAssist(assist, assistEvent, action));

  if (changed) await assistEvent.save();

  await CrmTaskService.onAfterUpdateEvent(
    assistEvent,
    {},
    login_user_id,
    !changed,
    false,
    comeFrom,
  );
};

const syncSubscriberOfAssist = async (assist, assistEvent, action) => {
  let subscriberUpdated = false;

  //sync subscribers
  const user = await GfUser.findByPk(assist.gfUserId, {
    include: { model: CrmUser, as: 'crm_user' },
  });

  if (action === 'cancel') {
    await CrTaskUserXref.update(
      { status: 0 },
      { where: { taskId: assistEvent.id } },
    );
    subscriberUpdated = true;
  } else {
    const subscribers = await CrTaskUserXref.findAll({
      where: { taskId: assistEvent.id },
      include: { model: CrmUser, as: 'user' },
    });

    let exist = null;
    let creator = null;
    subscribers.forEach((subscriber) => {
      if (subscriber.user.userId === user.crm_user.userId) exist = subscriber;

      if (subscriber.user.userId === assist.createdByUserId)
        creator = subscriber;
    });

    if (!exist) {
      const where = { taskId: assistEvent.id };
      if (creator?.user?.id) where.userId = { [Op.not]: creator.user.id };
      await CrTaskUserXref.update({ status: 0 }, { where });
      await CrTaskUserXref.create({
        userId: user.crm_user.id,
        taskId: assistEvent.id,
      });
      subscriberUpdated = true;
    }

    if (exist && creator?.id === exist.id) {
      const where = { taskId: assistEvent.id };
      if (creator?.user?.id) where.userId = { [Op.not]: creator.user.id };

      await CrTaskUserXref.update({ status: 0 }, { where });
      if (!creator.googleCalendarEventId) subscriberUpdated = true;
    }
  }

  return subscriberUpdated;
};

const syncAssistAndEvent = (assist, assistEvent) => {
  // Utility function to compare and update properties
  let hasAnyChange = false;
  const updateProperty = (
    currentObj,
    newObj,
    key,
    condition,
    formatter = (val) => val,
  ) => {
    if (condition) {
      hasAnyChange = true;
      currentObj[key] = formatter(newObj[key]);
    }
  };

  // keys to compare with their condition and replacement
  const keyMapper = {
    previsionDate: {
      condition: !moment(assistEvent.previsionDate).isSame(
        moment(assist.previsionDate),
      ),
      formatter: (val) => moment(val).format('YYYY-MM-DD HH:mm:ss'),
    },
    executedDate: {
      condition:
        moment(assist.executedDate).isValid() &&
        !moment(assist.executedDate).isSame(moment(assistEvent.executedDate)),
      formatter: (val) => moment(val).format('YYYY-MM-DD HH:mm:ss'),
    },
    duration: {
      condition: assist.duration !== assistEvent.duration,
    },
    alias: {
      condition:
        `Assistance ${assist.alias ? `(${assist.alias})` : ''}` !==
        assistEvent.alias,
      formatter: (val) => `Assistance ${val ? `(${val})` : ''}`,
    },
    aditionalText: {
      condition:
        `Assistance ${assist.alias ? `(${assist.alias})` : ''}` !==
        assistEvent.alias,
      formatter: (val) =>
        val?.replace(
          /Assistance \(([^)]+)\)/g,
          `Assistance ${assist.alias ? `(${assist.alias})` : ''}`,
        ),
    },
  };

  // Iterate over key mapper to update properties
  for (const key in keyMapper) {
    const { condition, formatter } = keyMapper[key];
    updateProperty(assistEvent, assist, key, condition, formatter);
  }

  return hasAnyChange;
};

const _syncAgendationEvent = async (
  agendationEvent,
  assist,
  title,
  login_user_id,
  comeFrom = '',
) => {
  if (title) {
    agendationEvent.alias = title;
    await agendationEvent.save();
    await CrmTaskService.onAfterUpdateEvent(
      agendationEvent,
      {},
      login_user_id,
      false,
      false,
      comeFrom,
    );
  }
};

exports.onEventUpdated = async (task, comeFrom = '') => {
  if (comeFrom === 'assist') return { success: true };
  comeFrom = 'event';
  const metadata = JSON.parse(
    task.refererMetadata ? task.refererMetadata : '{}',
  );
  const assist = await GfAssist.findByPk(metadata.assistanceId);
  switch (metadata.action) {
    case 'assistAgendationDone':
      return {
        success: true,
      };
    case 'assistanceDone':
      assist.previsionDate = moment(task.previsionDate).format(
        'YYYY-MM-DD HH:mm:ss',
      );
      assist.duration = task.duration;
      await assist.save();
      return {
        success: true,
      };
  }
};

exports.onEventExecuted = async (task, comeFrom = '') => {
  if (comeFrom === 'assist') return { success: true };
  comeFrom = 'event';
  const metadata = JSON.parse(
    task.refererMetadata ? task.refererMetadata : '{}',
  );
  const assist = await GfAssist.findByPk(metadata.assistanceId);

  switch (metadata.action) {
    case 'assistAgendationDone':
      if (!moment(assist.previsionDate).isValid() || !(assist.gfUserId > 0)) {
        return {
          success: false,
          reason: `You must provide a prevision date and user on assistance record`,
        };
      }
      break;
    case 'assistanceDone':
      assist.closed = 1;
      assist.executedDate = moment().format('YYYY-MM-DD HH:mm:ss');
      await assist.save();
      await Incidences_GfIncidencesService.checkIncidenceLabels(
        assist.incidenceId,
        null,
        comeFrom,
      );
  }

  return {
    success: true,
  };
};

exports.onEventDeExecuted = async (task, comeFrom = '') => {
  if (comeFrom === 'assist') return { success: true };
  comeFrom = 'event';
  const metadata = JSON.parse(
    task.refererMetadata ? task.refererMetadata : '{}',
  );
  const assist = await GfAssist.findByPk(metadata.assistanceId);

  switch (metadata.action) {
    case 'assistAgendationDone':
      if (!moment(assist.previsionDate).isValid() || !(assist.gfUserId > 0)) {
        return {
          success: true,
        };
      }
      break;
    case 'assistanceDone':
      assist.closed = 0;
      await assist.save();
      await Incidences_GfIncidencesService.checkIncidenceLabels(
        assist.incidenceId,
        null,
        comeFrom,
      );
      return {
        success: true,
      };
  }
};
