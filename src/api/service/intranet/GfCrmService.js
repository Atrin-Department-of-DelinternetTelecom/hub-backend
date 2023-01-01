// @ts-check
'use strict';

const Crm_AssistsService = require('./Crm_AssistsService');
const Crm_IncidenceService = require('./Crm_IncidenceService');
const Crm_SimDeliveryService = require('./Crm_SimDeliveryService');
const CrmInternetService = require('./CrmInternetService');
const CrmFixService = require('./CrmFixService');
const GfContractsUnpaidService = require('./GfContractsUnpaidService');
const GfBonusService = require('./Fee/GfBonusService');
const GfContractsFeeChangeService = require('./GfContractsFeeChangeService');
const assert = require('assert');
import moment from 'moment';

const { AnyModel } = require('@api/models');

const {
  intranet: { GfContract },
} = require('@models');
const GfContractSectionStatusService = require('./GfContractSectionStatusService');
const { GfSection } = require('@api/models/intranet/intranet_gf_sections');
const { SERVICE } = require('@api/constants/contracts');
const { default: to } = require('await-to-js');
const { suspendTheContract } = require('./Actions/SuspendContracts');
const {
  findOrFail,
} = require('./Actions/Caches/GfContractSectionStatusCaches');

/**
 *
 * @param {AnyModel} task
 * @param {number} userId
 * @param {string=} comeFrom
 * @returns
 */
exports.onEventUpdated = async (task, userId, comeFrom) => {
  const metadata = JSON.parse(
    task.refererMetadata ? task.refererMetadata : '{}',
  );
  if (metadata.assistance) {
    return Crm_AssistsService.onEventUpdated(task, comeFrom);
  } else if (metadata.incidence) {
    return Crm_IncidenceService.onEventUpdated(task);
  } else if (metadata.simDelivery) {
    return Crm_SimDeliveryService.onEventUpdated(task, comeFrom);
  } else if (metadata.section === 'INTERNET') {
    return CrmInternetService.onEventUpdated(task, userId);
  }
  return { success: true };
};

/**
 *
 * @param {AnyModel} task
 * @param {string=} comeFrom
 * @returns
 */
exports.onEventDeExecuted = async (task, comeFrom = '') => {
  const metadata = JSON.parse(
    task.refererMetadata ? task.refererMetadata : '{}',
  );
  if (metadata.assistance) {
    return Crm_AssistsService.onEventDeExecuted(task, comeFrom);
  } else if (metadata.incidence) {
    return Crm_IncidenceService.onEventDeExecuted(task);
  } else if (metadata.simDelivery) {
    return Crm_SimDeliveryService.onEventDeExecuted(task, comeFrom);
  }
  return { success: true };
};

/**
 *
 * @param {AnyModel} task
 * @param {number} userId
 * @param {string=} comeFrom
 * @returns
 */
exports.onEventExecuted = async (task, userId, comeFrom = '') => {
  const metadata = JSON.parse(
    task.refererMetadata ? task.refererMetadata : '{}',
  );

  if (metadata.assistance) {
    return Crm_AssistsService.onEventExecuted(task, comeFrom);
  }

  if (metadata.incidence) {
    return Crm_IncidenceService.onEventExecuted(task);
  }

  if (metadata.simDelivery) {
    return Crm_SimDeliveryService.onEventExecuted(task, comeFrom);
  }

  let result;

  switch (metadata.section) {
    case 'INTERNET': {
      result = await CrmInternetService.onEventExecuted(task, userId);
      break;
    }

    case 'FIX': {
      result = await CrmFixService.onEventChange(task, userId);
      break;
    }
  }

  if (result) return result;

  switch (metadata.action) {
    case 'blockDone': {
      await GfContractsUnpaidService.setDownDone(metadata.contractId);
      return { success: true };
    }

    case 'unblockDone': {
      await GfContractsUnpaidService.setUpDone(
        metadata.contractId,
        null,
        `CrmTask id:${task.id} unblockDone`,
      );
      return { success: true };
    }

    case 'blockDoneError': {
      const unpaidResult = await GfContractsUnpaidService.unpaid(
        metadata.contractId,
        null,
        null,
        userId,
        `CrmTask id:${task.id} blockDoneError`,
      );
      if (unpaidResult?.alive?.downState !== 'done') {
        return {
          success: false,
          reason: `Problem is not solved`,
        };
      }
      return unpaidResult;
    }

    case 'unBlockDoneError': {
      const resumeResult = await GfContractsUnpaidService.resume(
        metadata.contractId,
        null,
        userId,
        `CrmTask id:${task.id} unBlockDoneError`,
      );
      if (resumeResult?.alive?.upState !== 'done') {
        return {
          success: false,
          reason: `Problem is not solved`,
        };
      }
      return resumeResult;
    }

    case 'activateBono': {
      return GfBonusService.activate(metadata.xrefId, null, undefined, userId);
    }

    case 'deactivateBono': {
      return GfBonusService.deactive(metadata.xrefId, userId);
    }

    case 'changeConditionsDone': {
      return GfContractsFeeChangeService.changeDone({
        contractFeeChangeId: metadata.changeId,
        userId,
      });
    }

    case 'fixInstallationDone': {
      const contract = await GfContract.findByPk(metadata.rowId);
      assert(contract, 'Contract not found');
      const section = await GfSection.findByCode(SERVICE.FIX);
      assert(section, `[GfCrmService][VPBX]: Section [FIX] not found`);
      // try activate contract
      const [error] = await to(
        GfContractSectionStatusService.setDoneState(
          contract.id,
          section.id,
          userId,
        ),
      );

      return { success: error ? false : true };
    }

    case 'fixSuspendDone': {
      const serviceRecord = await findOrFail(metadata.rowId);
      const [error] = await to(
        suspendTheContract(serviceRecord.contract, serviceRecord, userId),
      );
      if (error) console.error(error);

      return { success: error ? false : true, reason: error?.message };
    }

    case 'fixVPBXUnblockDone': {
      const serviceRecord = await findOrFail(metadata.rowId);
      const [error] = await to(
        GfContractsUnpaidService.resume(
          serviceRecord.contract.id,
          moment().format('YYYY-MM-DD HH:mm:ss'),
          userId,
          'manually blocked',
          true,
          true,
        ),
      );
      if (error) console.error(error);
      return { success: error ? false : true, reason: error?.message };
    }

    case 'fixVPBXBlockDone': {
      const serviceRecord = await findOrFail(metadata.rowId);
      const [error] = await to(
        GfContractsUnpaidService.unpaid(
          serviceRecord.contract.id,
          moment().format('YYYY-MM-DD HH:mm:ss'),
          null,
          userId,
          'manually unblocked',
          true,
          true,
        ),
      );
      if (error) console.error(error);
      return { success: error ? false : true, reason: error?.message };
    }
  }

  switch (metadata.function) {
    case 'createFullEvent/devolution': {
      const bankCode = task.refererTrace.split('_')[1];
      if (bankCode) {
        // Invoice_GfDevolutionsManager::callDone($bankCode); TODO(ali): what is Invoice_GfDevolutionsManager
      }
      break;
    }
  }

  return {
    success: true,
  };
};
