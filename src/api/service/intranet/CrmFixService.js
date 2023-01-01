'use strict';

const { CrTask, GfContract } = require('@models').intranet;

const config = require('@config');
const CrmTaskHelperService = require('./CrmTaskHelperService');
const GfContractSectionStatusService = require('./GfContractSectionStatusService');
const OneTimeService = require('./OneTimeService');
const GfSectionService = require('./GfSectionService');
const moment = require('moment');
const _ = require('lodash');

exports.portafix = async function (contractId, userId) {
  if (config.get('intranet.disableCrmContracts', false)) return;

  const event = `portafix_${contractId}_FIX`;

  if (await CrmTaskHelperService.eventExists(event))
    return {
      success: true,
    };

  return CrmTaskHelperService.createFullEvent(
    'portafix',
    contractId,
    {
      subject: 'Aire portafix needed',
      metaData: {
        action: 'portafix',
        contractId: contractId,
      },
    },
    'FIX',
    null,
    userId,
  );
};

exports.onSectionFormSave = async function (oldData, newData, userId) {
  if (config.get('intranet.disableCrmContracts', false)) return;

  await this.checkAgendationPortaFix(newData, userId);
  await this.checkInstallation(oldData, newData, userId);
};

exports.checkAgendationPortaFix = async function (data, userId) {
  // determine valid IP
  let validIp = data.directIp ? true : false;

  if (validIp == false && data.internetSectionId > 0) {
    const contract = await GfContract.findByPk(data.internetSectionId);

    validIp = contract && contract.isActive();
  }

  return validIp
    ? await this.portafix(data.contractId, userId) // create portafix event if not created yet
    : { success: false, reason: 'No active IP yet' };
};

exports.checkInstallation = async function (oldData, newData, userId) {
  if (
    config.get('intranet.disableCrmContracts', false) ||
    oldData.autoExecuteDate == newData.autoExecuteDate ||
    moment(newData.autoExecuteDate).isSameOrBefore('1970-01-01')
  ) {
    return;
  }

  // a autoExecuteDate has been provided
  // create event for the installator
  return await this.installation(newData.contractId, userId);
};

exports.installation = async function (contractId, userId) {
  if (config.get('intranet.disableCrmContracts', false)) return;

  // if date has been changed overwrite
  await this.deleteTask(`installation_${contractId}_FIX`);

  const {
    section: { status, row },
    type,
  } = await GfContractSectionStatusService.findForContract(contractId);

  return await CrmTaskHelperService.createFullEvent(
    'installation',
    contractId,
    {
      subject: 'Fix router configuration needed',
      metadata: {
        action: 'installationFinished',
        contractId: contractId,
      },
      previsionDate: moment(row.autoExecuteDate).format('YYYY-MM-DD 08:00:00'),
    },
    'FIX',
    null,
    userId,
  );
};

exports.deleteTask = async function (refererTrace) {
  const task = await CrTask.findOne({
    where: {
      refererTrace: refererTrace,
    },
  });

  await task.destroy();

  // remove on time create block event
  await OneTimeService.unMark('global', refererTrace);

  return { success: true };
};

exports.onEventChange = async function (task, userId) {
  //	if (DISABLE_CRM_CONTRACTS==1){
  // 	return;
  // }
  const metadata = JSON.parse(task.refererMetadata);

  switch (metadata.action) {
    case 'installationFinished': {
      const sectionId = await GfSectionService.getSectionIdByCode('INTERNET');
      await GfContractSectionStatusService.setState(
        metadata.contractId,
        sectionId,
        'done',
        null,
        null,
        userId,
      );
      break;
    }
  }

  return false;
};
