'use strict';

const { GfIncidence } = require('@models').intranet;

const CrmTaskService = require('./CrmTaskService');

const CrmTaskHelperService = require('./CrmTaskHelperService');

const GfContractSectionStatusService = require('./GfContractSectionStatusService');

const Incidences_GfIncidencesService = require('./Incidences_GfIncidencesService');

const GfContractService = require('./GfContractService');

const moment = require('moment');

let comeFrom = '';

exports.newIncidence = async (incidence, userLoginId) => {
  comeFrom = 'incidence';
  await _checkWhatToDo(incidence, userLoginId);
};

exports.incidenceUpdated = async (incidence) => {
  comeFrom = 'incidence';
  await _checkWhatToDo(incidence);
};

const _checkWhatToDo = async (incidence, userLoginId = null) => {
  const section = await GfContractSectionStatusService.findForContract(
    incidence.contractId,
  );
  const key = await Incidences_GfIncidencesService.getIncidenceTrace(
    incidence,
    section.type,
  );
  const incidenceTrace = key;

  let incidenceEvent = await CrmTaskHelperService.getTaskByTrace(
    incidenceTrace,
  );

  let state = '';

  if (incidence.closed) {
    state = `allDone`;
  }

  if (state === '' && !incidence.closed) {
    state = `incidencePending`;
  }

  if (state === '') {
    return {
      success: false,
      error: 'No state found on _checkWhatToDo',
    };
  }

  // what we have to do based on state and event

  switch (state) {
    case `incidencePending`:
      if (!incidenceEvent) {
        await newEventForIncidence(incidence.id, userLoginId);
        incidenceEvent = await CrmTaskHelperService.getTaskByTrace(
          incidenceTrace,
        );
      }
      if (incidenceEvent.executed === '1') {
        await CrmTaskService.tglExecute(
          incidenceEvent.id,
          null,
          null,
          0,
          false,
          userLoginId,
        );
        incidenceEvent = await CrmTaskHelperService.getTaskByTrace(
          incidenceTrace,
        );
      }
      await _syncIncidenceEvent(incidenceEvent, incidence, userLoginId);
      break;
    case `allDone`:
      if (!incidenceEvent.executed || !parseInt(incidenceEvent.executed)) {
        await CrmTaskService.tglExecute(
          incidenceEvent.id,
          null,
          null,
          1,
          false,
          userLoginId,
        );
      }
      break;
    default:
      break;
  }

  return {
    success: true,
  };
};

const newEventForIncidence = async (incidence, userLoginId) => {
  let incidenceModel = incidence;
  if (typeof incidence !== 'object') {
    incidenceModel = await GfIncidence.findByPk(incidence);
  }

  const section = await GfContractSectionStatusService.findForContract(
    incidenceModel.contractId,
  );
  let sufix = '';
  if (section.type === 'INTERNET') {
    const condition = await GfContractService.getActualConditionsBySection(
      incidenceModel.contractId,
    );
    const technology = condition.internetTechnology;
    sufix = `/${technology}`;
  }

  return CrmTaskHelperService.createFullEvent(
    `incidence${sufix}`,
    incidenceModel.contractId,
    {
      motherTaskId: incidenceModel.motherEventId,
      subject: 'Incidence',
      text: `<b> ${incidenceModel.description} </b><br><br>`,
      metadata: {
        action: 'incidenceDone',
        contractId: incidenceModel.contractId,
        incidenceId: incidenceModel.id,
        incidence: true,
      },
    },
    section.type,
    incidenceModel.id,
    userLoginId,
  );
};

const _syncIncidenceEvent = async (incidenceEvent, incidence, userLoginId) => {
  if (
    incidence.executedDate &&
    moment(incidence.executedDate).isValid() &&
    !moment(incidence.executedDate).isSame(
      moment(moment(incidenceEvent.executedDate)),
    )
  ) {
    incidenceEvent.executedDate = incidence.executedDate;
    await incidenceEvent.save();
    await CrmTaskService.onAfterUpdateEvent(
      incidenceEvent,
      {},
      userLoginId,
      false,
      false,
      'incidence',
    );
  }
};

exports.onEventUpdated = async (task) => {
  if (comeFrom === 'incidence') return { success: true };
  comeFrom = 'event';
  return {
    success: true,
  };
};

exports.onEventExecuted = async (task) => {
  if (comeFrom === 'incidence') return { success: true };
  comeFrom = 'event';

  const metadata = JSON.parse(task.refererMetadata);
  const incidence = await GfIncidence.findByPk(metadata.incidenceId);

  switch (metadata.action) {
    case 'incidenceDone':
      incidence.closed = 1;
      incidence.executedDate = moment().format('YYYY-MM-DD HH:mm:ss');
      await incidence.save();
  }
  return {
    success: true,
  };
};

exports.onEventDeExecuted = async (task) => {
  if (comeFrom === 'incidence') return { success: true };
  comeFrom = 'event';
  const metadata = JSON.parse(task.refererMetadata);
  const incidence = await GfIncidence.findByPk(metadata.incidenceId);

  switch (metadata.action) {
    case 'incidenceDone':
      incidence.closed = 0;
      await incidence.save();
      return {
        success: true,
      };
  }
  return {
    success: true,
  };
};
