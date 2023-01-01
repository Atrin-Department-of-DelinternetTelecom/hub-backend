import { AnyModel, intranet } from '@models';
import { createFullEvent, setTaskIgnored } from './CrmTaskHelperService';

import { CONTRACT } from '@api/constants/statuses';
import CrmChangeConditionsService from './CrmChangeConditionsService';
import CrmInternetService from './CrmInternetService';
import CrmTaskService from './CrmTaskService';
import { SERVICE } from '@api/constants/contracts';
import config from '@config';
import { findOrFail } from './Actions/Caches/GfContractSectionStatusCaches';
import { getSectionCodeById } from './GfSectionService';
import moment from 'moment';

const { CrTask } = intranet;

export const stateForcedToChange = async (
  contractId: number,
  state: CONTRACT,
  userId: number,
) => {
  if (config.get('intranet.disableCrmContracts', false)) {
    return true;
  }

  const { type } = await findOrFail(contractId);

  return createFullEvent(
    'contractStateChanged/' + state,
    contractId,
    {
      subject: `${type} contract forcibly ${
        state === CONTRACT.ACTIVE ? 'activated' : 'inactivated'
      }`,
    },
    type,
    null,
    userId,
  );
};

export const stateChanged = async function (
  contractId: number,
  state: CONTRACT,
  userId: number,
) {
  if (config.get('intranet.disableCrmContracts', false)) {
    return true;
  }

  const { type, contract } = await findOrFail(contractId);
  const eventKey = 'contractStateChanged/' + state;
  const serviceName = getServiceForSectionType(type);
  const event = {
    subject: getEventSubjectForState(state, type),
    onetime: true,
  };

  const isActivated = contract.dateActivation
    ? moment(contract.dateActivation).add(2, 'day').isBefore(moment())
    : false;

  if (type && typeof serviceName?.contractStateChanged == 'function') {
    await serviceName.contractStateChanged(contractId, state, userId);
  }

  if (
    (state === CONTRACT.ACTIVE && isActivated && contract.imported !== 1) ||
    ![
      CONTRACT.ACTIVE,
      CONTRACT.SUSPENDED,
      CONTRACT.PENDING_SECTION_READY,
    ].includes(state)
  ) {
    return true;
  }

  const result = await createFullEvent(
    eventKey,
    contractId,
    event,
    type,
    null,
    userId,
  );

  return state == CONTRACT.ACTIVE && contract.linkedContractId
    ? linkedContractActivated(
        contractId,
        contract.linkedContractId,
        type,
        userId,
      )
    : result;
};

export const linkedContractActivated = async function (
  contractId: number,
  linkedContractId: number,
  type: SERVICE,
  userId: number,
) {
  const { row, status, contract } = await findOrFail(linkedContractId);
  const event = {
    subject: type + ' Linked contract activated',
    contract2: contract,
    section2: { row, status },
    onetime: true,
  };

  return createFullEvent(
    'eventContractLinked',
    contractId,
    event,
    type,
    null,
    userId,
  );
};

export const getEventSubjectForState = function (
  state: CONTRACT,
  type: SERVICE,
) {
  const subjects: Partial<Record<CONTRACT, string>> = {
    [CONTRACT.SUSPENDED]: `${type} contract suspended`,
    [CONTRACT.PENDING_SECTION_READY]: `${type} contract created`,
    [CONTRACT.ACTIVE]: `${type} contract activated`,
  };

  return subjects[state] ?? `${type} state changed to:${state}`;
};

/**
 * This function will create some events
 */
export const changeConditions = async function (
  gfContractsFeeChangeId: number,
  onlyInfo = false,
  userId: number,
) {
  return CrmChangeConditionsService.changeConditions(
    gfContractsFeeChangeId,
    onlyInfo,
    userId,
  );
};

export const removeChangeConditionsEvent = async function (
  gfContractsFeeChangeId: number,
  onlyExecutable: boolean,
) {
  return CrmChangeConditionsService.removeChangeConditionsEvent(
    gfContractsFeeChangeId,
    onlyExecutable,
  );
};

export const sectionStateChanged = async function (
  contractId: number,
  sectionTypeId: number,
  pendingSate: string | null,
  userId: number,
) {
  const sectionCode = await getSectionCodeById(sectionTypeId);

  if (sectionCode === SERVICE.INTERNET) {
    return CrmInternetService.sectionStateChanged(
      contractId,
      pendingSate,
      userId,
    );
  }
};

export const markAsExecuted = async function (
  refererTrace: string,
  andIgnored = true,
) {
  const task = await CrTask.findOne({ where: { refererTrace } });

  if (task === null) return { success: true };

  if (andIgnored) await setTaskIgnored(refererTrace);

  if (task.executed) return { success: true };

  return CrmTaskService.setExecuted(task.id);
};

export const blockStateChanged = async function (unpaid: AnyModel) {
  const { type } = await findOrFail(unpaid.contractId);

  if (unpaid.downState == 'revoked') {
    // changed to up
    await infoUnblock(unpaid.contractId, type);
    await setTaskIgnored(`infoBlock_${unpaid.contractId}_${type}`);
  } else {
    // changed to down
    await infoBlock(unpaid.contractId, type);
    await setTaskIgnored(`infoUnBlock_${unpaid.contractId}_${type}`);
  }
};

export const infoBlock = async function (contractId: number, type: SERVICE) {
  const event = {
    subject: `${type} contract blocked`,
    onetime: true,
  };

  return createFullEvent('infoBlock', contractId, event, type);
};

export const infoUnblock = async function (contractId: number, type: SERVICE) {
  const event = {
    subject: `${type} contract unblocked`,
    onetime: true,
  };

  return createFullEvent('infoUnblock', contractId, event, type);
};

/**
 * Get facade name by section type.
 */
const getServiceForSectionType = function (sectionType: SERVICE) {
  return {
    [SERVICE.INTERNET]: CrmInternetService,
    [SERVICE.CELL]: undefined,
    [SERVICE.FIX]: undefined,
    [SERVICE.TV]: undefined,
    [SERVICE.SUBSCRIPTION]: undefined,
  }[sectionType];
};
