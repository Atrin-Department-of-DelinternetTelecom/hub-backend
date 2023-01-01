'use strict';

const {
  GfIncidence,
  GfAssist,
  CrTaskExtraField,
  CrTaskExtraFieldXref,
  GfContract,
  CrTask,
} = require('@models').intranet;

const { getActualConditions } = require('./Fee/GfFeeService');

const GfSectionService = require('./GfSectionService');

const { get } = require('./ConfigService');
const CrmTaskService = require('./CrmTaskService');

exports.getIncidenceTrace = async (incidence, sectionType = null) => {
  const validSectionType = sectionType ? sectionType : incidence.sectionCode;
  let key;
  if (validSectionType === 'INTERNET') {
    const contract = await GfContract.findByPk(incidence.contractId);
    const condition = await getActualConditions(contract.feeGroupId);
    const technology = condition.internetTechnology;
    key = `incidence/${technology}_${incidence.id}_${validSectionType}`;
  } else {
    key = `incidence_${incidence.id}_${validSectionType}`;
  }
  return key;
};

exports.checkIncidenceLabels = async (
  incidence,
  login_user_id,
  comeFrom = '',
) => {
  const lableId = await get('goufone', 'tagIdForIncidenceWithAssistance');
  if (!lableId) {
    return {
      success: true,
    };
  }

  let incidenceModel = incidence;
  if (typeof incidence !== 'object') {
    incidenceModel = await GfIncidence.findByPk(incidence);
  }
  if (!incidenceModel) {
    return {
      success: false,
      reason: 'incidence not found',
    };
  }

  const type = await GfSectionService.getContractSectionCode(
    incidenceModel.contractId,
  );

  const refererTrace = await exports.getIncidenceTrace(incidenceModel, type);
  const event = await CrTask.findOne({
    where: {
      refererTrace,
    },
  });

  if (!event) {
    return {
      success: false,
      reason: `incidence event not found`,
    };
  }

  const openAssists = await GfAssist.count({
    where: {
      incidenceId: incidenceModel.id,
      closed: '0',
    },
  });

  const label = await CrTaskExtraFieldXref.findOne({
    where: {
      taskId: event.id,
      extraFieldId: lableId,
    },
  });

  if (openAssists > 0 && !label) {
    await CrTaskExtraFieldXref.create({
      taskId: event.id,
      extraFieldId: lableId,
    });
  }

  if (openAssists === 0 && label) {
    await CrTaskExtraFieldXref.destroy({
      where: {
        id: label.id,
      },
    });
  }

  await CrmTaskService.onAfterUpdateEvent(
    event,
    {},
    login_user_id,
    false,
    false,
    comeFrom,
  );

  return {
    success: true,
  };
};
