import * as models from '@api/models';

import {
  findByContractId,
  forget as forgetContracts,
  setupCache as setupCellCache,
} from './Caches/CellContracts';
import {
  findForKey,
  forget as forgetFees,
  setupCache as setupFeeCache,
} from './Caches/CellActualFeeGroup';

import { AireSyncError } from './Errors/AireSyncError';
import { FeeChangeError } from './Errors/FeeChangeError';
import { GfAireContract } from '@api/models/intranet/intranet_gf_aire_contracts';
import assert from 'assert';
import { pluck } from '@api/utils/collections';
import { sync } from '../SuggestDiscountService';
import { updateAllFromClient } from '../GfDiscountsPendingService';

const {
  intranet: { GfAireContractSyncError },
} = models;

const forget = async () => {
  await forgetFees();
  await forgetContracts();
};

/**
 * Sync the intranet contracts fee-group for the given AIRE contracts.
 */
export const handle = async (aireContracts: GfAireContract[]) => {
  // at first we cache the contracts for better performance
  await setupCellCache(pluck(aireContracts, 'linkedContractId'));
  await setupFeeCache();
  const results = await Promise.allSettled(aireContracts.map(syncAireTarifa));

  const errors = results.filter(
    (result) => result.status === 'rejected',
  ) as PromiseRejectedResult[];

  const reportableErrors = errors.filter((error) => {
    if (error.reason instanceof AireSyncError) {
      return true;
    }

    console.error(error);
    return false;
  });

  await GfAireContractSyncError.bulkCreate(
    reportableErrors.map((error) => error.reason.jsonSerialize()),
  );

  await forget();
};

/**
 * Sync local contract fee-group with given aire contract.
 * The Aire contracts stored in the `gf_aire_contracts` table
 * The intranet contracts stored in the `gf_contracts` and `gf_contract_data_cell` table.
 * Following action find coresponding intranet contract for each AIRE contracts
 * Then check if local contract using diffrent Aire tarifa, try to update it.
 */
export const syncAireTarifa = async (
  aireContract: GfAireContract,
): Promise<void> => {
  const intranetContract = await findByContractId(
    Number(aireContract.linkedContractId),
  );

  if (!aireContract.active || !aireContract.siglas || !intranetContract) {
    // no need to change
    return;
  }

  // check actual contract fee group
  const feeGroupId = await findForKey(aireContract.siglas);
  assert(feeGroupId, new FeeChangeError(aireContract.id, aireContract.number));

  // update fee-group if has diffrence
  if (intranetContract.feeGroupId !== feeGroupId) {
    await intranetContract.update({ feeGroupId: feeGroupId });
    // check discounts
    await updateAllFromClient(intranetContract.clientId);
    await sync(intranetContract.id);
  }
};
