import { AnyModel, intranet } from '@api/models';
import { CONTRACT, SECTION_STATUS } from '@api/constants/statuses';
import {
  ServiceRecord,
  findForContract,
  forget,
  setupCache,
} from './Caches/GfContractSectionStatusCaches';

import { SERVICE } from '@api/constants/contracts';
import assert from 'assert';
import { blockContract } from '../RadiusService';
import factory from '../Contract/Facades';
import { fixSuspendTask } from '../Contract/helpers/events';
import moment from 'moment';
import { releaseAssignables } from './ReleaseAssignables';
import { resume } from './../GfContractsUnpaidService';
import { setState } from '../GfContractService';
import { throwIf } from '@api/utils/helpers';

const { GfContract, GfContractDataFix } = intranet;

/**
 * Ran the given suspendion actions.
 */
export const handle = async (
  contracts: AnyModel[] = [],
  userId: number,
): Promise<PromiseSettledResult<AnyModel>[]> => {
  // setup caching when need
  if (contracts.length > 0) {
    await setupCache(contracts.map((contract) => contract.id));
  }
  // do operation
  const suspensions = await Promise.allSettled(
    contracts.map((contract) => applySuspension(contract, userId)),
  );
  // forget cache
  await forget();

  return suspensions;
};

const applySuspension = async (
  contract: AnyModel,
  userId: number,
): Promise<AnyModel> => {
  const serviceRecord = await findForContract(contract.id);

  if (!serviceRecord || (!serviceRecord.type && !serviceRecord.row)) {
    // it's an unfinished contract
    await contract.update({ state: CONTRACT.SUSPENDED });
  } else if (serviceRecord.type === SERVICE.INTERNET && contract.isFrozen()) {
    // it's an frozen state
    await freezeTheContract(contract);
  } else if (
    serviceRecord.type === SERVICE.FIX &&
    !serviceRecord.row!.isParticular()
  ) {
    //@ts-ignore
    await fixSuspendTask(serviceRecord.row, userId);
  } else {
    // it's an delete action
    await suspendTheContract(contract, serviceRecord, userId);
  }

  return contract;
};

const freezeTheContract = async (contract: AnyModel) => {
  const { success } = await blockContract(contract.id);
  assert(success, 'Failure to block the service');

  await contract.update({
    state: CONTRACT.SUSPENDED,
    dateDeactivation: moment().format('YYYY-MM-DD HH:mm:ss'),
  });
};

export const suspendTheContract = async (
  contract: AnyModel,
  serviceRecord: ServiceRecord,
  userId: number,
) => {
  await reassignLinkedContracts(
    contract,
    serviceRecord.type,
    serviceRecord.status.state,
  );

  if (contract.isBlocked()) {
    await resume(contract.id, null, userId, `Resume before suspend`);
  }

  if (contract.isActive() || contract.isSuspended() || contract.isBlocked()) {
    await setState(
      contract,
      CONTRACT.SUSPENDED,
      userId,
      !contract.isSuspended() ||
        serviceRecord.status.state !== SECTION_STATUS.SUSPENDED,
    );
  }

  if (contract.isPendingSectionsReady()) {
    // down related services
    await factory(serviceRecord.type).down(contract.id, userId);
  }

  // release ip and number in use
  await releaseAssignables(serviceRecord, userId);

  return contract;
};

/**
 * Check if the contract are not using as internet section.*
 */
const reassignLinkedContracts = async (
  contract: AnyModel,
  type: SERVICE,
  state: SECTION_STATUS & string,
) => {
  if (type !== SERVICE.INTERNET) {
    return;
  }
  // @ts-ignore
  // check if there are a linked contract
  const contracts: AnyModel[] = await GfContract.selectFromInternetId(
    contract.id,
  );
  // it's not used as internet section
  if (contracts.length === 0) {
    return;
  }
  // @ts-ignore
  const linkedContracts = await GfContract.linkedContracts(contract.id);

  throwIf(
    contracts.length > 0 && linkedContracts.length !== 1,
    linkedContracts.length > 1
      ? 'More than one contracts linked to this'
      : 'There are fix contracts vinculed to this internet',
  );

  // move fixes to the new contract
  await GfContractDataFix.update(
    {
      internetSectionId: linkedContracts[0].id,
    },
    {
      where: {
        contractId: contracts.map((contract) => contract.id),
      },
    },
  );

  if (state === SECTION_STATUS.PENDING) {
    // MooWSManager::fire("server_installationChanged");
  }
};
