import { CELL_PROVIDER_CODE, SERVICE } from '@api/constants/contracts';
import {
  CHNAGE_HOLDER_STATE,
  CHNAGE_HOLDER_STATE_OPTION,
} from '@api/constants/statuses';
import {
  ServiceRecord,
  findOrFail,
} from './Caches/GfContractSectionStatusCaches';

import { Aire } from '@lib/sdk';
import { DelinternetStorage } from '@api/service/documents/storages/DelinternetStorage';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { TYPE } from '@api/constants/documents';
import { User } from '@api/models/global/global_users';
import assert from 'assert';
import { errors } from '@api/http/http_errors';
import { getProviderConditions } from '../Contract/helpers';
import { intranet } from '@models';

const { GfContractHolderChange, GfSubscriberType } = intranet;

export interface ChangeHolderParams {
  contractId: number;
  clientId: number;
  userId: number;
}

/**
 * Process a contract for changing the holder.
 */
export const handle = async ({
  contractId,
  clientId,
  userId,
}: ChangeHolderParams) => {
  const serviceRecord = (await findOrFail(contractId)) ?? {};

  assert(
    !(await hasHolderChangeInProgress(contractId)),
    new errors.BadRequest('An change holder request already in progress'),
  );
  assert(
    serviceRecord.contract!.clientId !== clientId,
    new errors.BadRequest('Destination client is the actual owner'),
  );

  const targetClient = await getTargetClient(clientId);

  return serviceRecord.type === SERVICE.CELL
    ? changeCellContractHolder(serviceRecord, targetClient, userId)
    : makeChangeHolderRequest(serviceRecord, targetClient, userId);
};

/**
 * Process a "CELL" contract for changing the holder.
 */
const changeCellContractHolder = async (
  serviceRecord: ServiceRecord,
  targetClient: GfClient,
  userId: number,
) => {
  const { row, contract } = serviceRecord;
  const { provider, cellFee } = await getProviderConditions(
    contract.feeGroupId,
  );
  // handle lemon change holder as regular
  if (provider.code === CELL_PROVIDER_CODE.LEMON) {
    return makeChangeHolderRequest(serviceRecord, targetClient, userId);
  }
  // first step cell holder change
  const trackingCode = await Aire.changeHolder({
    telefono: row!.number,
    subscriberType: targetClient.subscriberType!.aireNetworksCode,
    nif: targetClient.fiscalId,
    tarifa: cellFee.providerFeeId,
  });

  const changeHolder = await makeChangeHolderRequest(
    serviceRecord,
    targetClient,
    userId,
    TYPE.CHANGE_AIRE_HOLDER,
  );

  await changeHolder.update({
    provider_tracking_code: trackingCode.replace(/##/g, ''),
  });

  return changeHolder;
};

/**
 * First step, create change holder row and waiting for documentation.
 */
const makeChangeHolderRequest = async (
  { contract }: ServiceRecord,
  targetClient: GfClient,
  userId: number,
  storageType = TYPE.CHANGE_HOLDER,
) => {
  const document = await DelinternetStorage.create(
    storageType,
    (await User.findOne({ where: { user_id: userId } }))?.id ?? 0,
  );
  // insert change holder row
  const changeHolder = await GfContractHolderChange.create({
    contractId: contract.id,
    fromClientId: contract!.clientId,
    toClientId: targetClient.id,
    state: CHNAGE_HOLDER_STATE.INPROGRESS,
    stateOption: CHNAGE_HOLDER_STATE_OPTION.PENDING_DOCUMENTATION,
    docId: document.id,
  });

  return changeHolder;
};

/**
 * Check if there is an "in-progress" holder change for gven contract id.
 */
const hasHolderChangeInProgress = async (
  contractId: number,
): Promise<boolean> => {
  const inProgress = await GfContractHolderChange.findOne({
    where: {
      state: CHNAGE_HOLDER_STATE.INPROGRESS,
      contractId,
    },
    attributes: ['id'], // Only select the ID field for optimization
    raw: true,
  });

  return !!inProgress;
};

export const getTargetClient = async (clientId: number): Promise<GfClient> => {
  const client = await GfClient.findByPk(clientId, {
    include: { model: GfSubscriberType, as: 'subscriberType' },
  });
  // prevent change holder for inactive client
  assert(client, new errors.BadRequest('Target client not found'));
  // prevent change holder for inactive client
  assert(client?.isActive(), new errors.BadRequest('Target client not active'));

  return client;
};
