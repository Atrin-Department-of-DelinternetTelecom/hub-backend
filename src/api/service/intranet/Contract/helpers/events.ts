import {
  createFullEvent,
  getTaskByTrace,
  markAsCanceled,
  setTaskIgnored,
} from '../../CrmTaskHelperService';

import { GfContractDataFix } from '@api/models/intranet/intranet_gf_contract_data_fix';
import { SERVICE } from '@api/constants/contracts';
import moment from 'moment';
import { setExecuted2 } from '../../CrmTaskService';

const DEFAULT_USER_ID = 2338;

/**
 * -----------------------------
 * OTHER TASKS
 * -----------------------------
 */

export const fixPortabilityDenied = async (
  contractId: number,
  userId = DEFAULT_USER_ID,
) => {
  return createFullEvent(
    `denied_portability`,
    contractId,
    {
      subject: 'portabilitat denegada',
      metadata: { contractId },
      previsionDate: moment().format('YYYY-MM-DD HH:mm:ss'),
      onetime: true,
    },
    SERVICE.FIX,
    String(contractId),
    userId,
  );
};

export const fixInstallationTask = async (
  dataFix: GfContractDataFix,
  userId = DEFAULT_USER_ID,
) => {
  return createFullEvent(
    dataFix.isParticular() ? 'installation/FIX' : `installation_VPBX`,
    dataFix.contractId,
    {
      subject: dataFix.isParticular() ? 'Instalació FIX' : 'Instalació VPBX',
      metadata: { rowId: dataFix.contractId, action: 'fixInstallationDone' },
      previsionDate: moment().format('YYYY-MM-DD HH:mm:ss'),
      onetime: true,
    },
    SERVICE.FIX,
    String(dataFix.contractId),
    userId,
  );
};

export const fixSuspendTask = async (
  dataFix: GfContractDataFix,
  userId = DEFAULT_USER_ID,
) => {
  return createFullEvent(
    dataFix.isParticular() ? 'contractStateChanged/suspended' : `suspend_VPBX`,
    dataFix.contractId,
    {
      subject: dataFix.isParticular()
        ? 'FIX contract suspended'
        : 'VPBX contract suspended',
      metadata: { rowId: dataFix.contractId, action: 'fixSuspendDone' },
      previsionDate: moment().format('YYYY-MM-DD HH:mm:ss'),
      onetime: true,
    },
    SERVICE.FIX,
    String(dataFix.contractId),
    userId,
  );
};

export const fixCompanyBlockTask = async (
  dataFix: GfContractDataFix,
  userId = DEFAULT_USER_ID,
) => {
  return createFullEvent(
    `block_VPBX`,
    dataFix.contractId,
    {
      subject: 'Block VPBX',
      metadata: { rowId: dataFix.contractId, action: 'fixVPBXBlockDone' },
      previsionDate: moment().format('YYYY-MM-DD HH:mm:ss'),
      onetime: true,
    },
    SERVICE.FIX,
    String(dataFix.contractId),
    userId,
  );
};

export const fixCompanyUnBlockTask = async (
  dataFix: GfContractDataFix,
  userId = DEFAULT_USER_ID,
) => {
  return createFullEvent(
    `unblock_VPBX`,
    dataFix.contractId,
    {
      subject: 'Unblock VPBX',
      metadata: { rowId: dataFix.contractId, action: 'fixVPBXUnblockDone' },
      previsionDate: moment().format('YYYY-MM-DD HH:mm:ss'),
      onetime: true,
    },
    SERVICE.FIX,
    String(dataFix.contractId),
    userId,
  );
};

/**
 * -----------------------------
 * BLOCKING TASKS
 * -----------------------------
 */

export const executeBlockingTasks = async (
  service: SERVICE,
  contractId: number,
  comesFromTask = false,
) => {
  const event = await getBlockingTask(service, contractId);
  if (!event) return; //nothing to do

  if (!comesFromTask) {
    await setExecuted2({ taskId: event.id, ignoreTrigger: true });
  }
  await ignoreBlockingTask(service, contractId);
};

export const cancelBlockingTask = async (
  service: SERVICE,
  contractId: number,
) => {
  return markAsCanceled(getBlockingTraceName(service, contractId));
};

export const ignoreBlockingTask = async (
  service: SERVICE,
  contractId: number,
) => {
  return setTaskIgnored(getBlockingTraceName(service, contractId));
};

export const getBlockingTask = async (service: SERVICE, contractId: number) => {
  return getTaskByTrace(getBlockingTraceName(service, contractId));
};

export const serviceBlockFailed = async (
  service: SERVICE,
  contractId: number,
  reason: string,
  userId = DEFAULT_USER_ID,
) => {
  return createFullEvent(
    'doBlock',
    contractId,
    {
      subject: `Error al bloquejar contracte ${service}`,
      text: formatErrorMessages(`Has de bloquejar el segünet`, reason),
      metadata: { action: 'blockDoneError', contractId },
      onetime: true,
    },
    service,
    null,
    userId,
  );
};

export const serviceBlockingTask = async (
  service: SERVICE,
  contractId: number,
  userId = DEFAULT_USER_ID,
) => {
  return createFullEvent(
    'doBlock',
    contractId,
    {
      subject: `Bloquejar contracte ${service}`,
      text: `Has de bloquejar el segünet ${service}`,
      metadata: { action: 'blockDone', contractId },
      onetime: true,
    },
    service,
    null,
    userId,
  );
};

export const getBlockingTraceName = (service: SERVICE, contractId: number) => {
  return `doBlock_${contractId}_${service}`;
};

/**
 * -----------------------------
 * UNBLOCKING TASKS
 * -----------------------------
 */
export const serviceUnblockingTask = async (
  service: SERVICE,
  contractId: number,
  userId = DEFAULT_USER_ID,
  message: string | null = null,
) => {
  return createFullEvent(
    'doUnBlock',
    contractId,
    {
      subject: `Desbloquejar contracte ${service}`,
      text: formatErrorMessages(
        `Has de desbloquejar el segünet contracte`,
        message,
      ),
      metadata: { action: 'unblockDone', contractId },
      onetime: true,
    },
    service,
    null,
    userId,
  );
};

export const getUnblockingTraceName = (
  service: SERVICE,
  contractId: number,
) => {
  return `doUnBlock_${contractId}_${service}`;
};

export const cancelUnblockingTask = async (
  service: SERVICE,
  contractId: number,
) => {
  return markAsCanceled(getUnblockingTraceName(service, contractId));
};

export const ignoreUnblockingTask = async (
  service: SERVICE,
  contractId: number,
) => {
  return setTaskIgnored(getUnblockingTraceName(service, contractId));
};

export const getUnblockingTask = async (
  service: SERVICE,
  contractId: number,
) => {
  return getTaskByTrace(getUnblockingTraceName(service, contractId));
};

export const executeUnblockingTasks = async (
  service: SERVICE,
  contractId: number,
  comesFromTask = false,
) => {
  const event = await getUnblockingTask(service, contractId);
  if (!event) return; //nothing to do

  if (!comesFromTask) {
    await setExecuted2({ taskId: event.id, ignoreTrigger: true });
  }
  await ignoreUnblockingTask(service, contractId);
};

export const serviceUnblockFailed = async (
  service: SERVICE,
  contractId: number,
  reason: string,
  userId = DEFAULT_USER_ID,
) => {
  return createFullEvent(
    'doUnBlock',
    contractId,
    {
      subject: `Desbloquejar contracte ${service}`,
      text: formatErrorMessages(
        `Has de desbloquejar el segünet contracte`,
        reason,
      ),
      metadata: { action: 'unblockDone', contractId },
      onetime: true,
    },
    service,
    null,
    userId,
  );
};

/**
 * -----------------------------
 * HELPER FUNCTIONS
 * -----------------------------
 */

const formatErrorMessages = (message: string, reason: string | null = null) => {
  return reason ? [message, `<hr><b>${reason}</b><br>`].join(' ') : message;
};
