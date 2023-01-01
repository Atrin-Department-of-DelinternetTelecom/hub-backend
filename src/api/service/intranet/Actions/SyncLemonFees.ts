import {
  findByContractId,
  setupCache as setupCellCache,
} from './Caches/CellContracts';
import {
  findForKey,
  setupCache as setupFeeCache,
} from './Caches/CellActualFeeGroup';

import { CELL_PROVIDER_CODE } from '@api/constants/contracts';
import { LemonLine } from '@api/models/intranet/intranet_lemon_line';
import assert from 'assert';
import { intranet } from '@api/models';
import moment from 'moment';
import { pluck } from '@api/utils/collections';
import { sync } from '../SuggestDiscountService';
import { updateAllFromClient } from '../GfDiscountsPendingService';

const { GfContractFeeChange } = intranet;

/**
 * Sync the intranet contracts fee-group for the given AIRE contracts.
 */
export const handle = async (lemonLines: LemonLine[]) => {
  // at first we cache the contracts for better performance
  await Promise.all([
    setupCellCache(pluck(lemonLines, 'gf_contract_id'), [
      CELL_PROVIDER_CODE.LEMON,
    ]),
    setupFeeCache(),
  ]);

  const results = await Promise.allSettled(lemonLines.map(syncLemonFee));

  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.error(result.reason);
    }
  });
};

/**
 * Sync local contract fee-group with given lemon contract.
 * The Aire contracts stored in the `gf_lemon_contracts` table
 * The intranet contracts stored in the `gf_contracts` and `gf_contract_data_cell` table.
 * Following action find corresponding intranet contract for each AIRE contracts
 * Then check if local contract using different Aire tarifa, try to update it.
 */
export const syncLemonFee = async (lemonLine: LemonLine): Promise<void> => {
  const intranetContract = await findByContractId(
    Number(lemonLine.gf_contract_id),
  );

  if (!lemonLine.isActive() || !lemonLine.packageId || !intranetContract) {
    // no need to change
    return;
  }

  // check actual contract fee group
  const feeGroupId = await findForKey(lemonLine.packageId);
  assert(
    feeGroupId,
    `Fee group for package "${lemonLine.packageId}" not found!`,
  );
  // Check to see if an update is needed
  if (intranetContract.feeGroupId == feeGroupId) {
    return;
  }
  // update fee-group
  await GfContractFeeChange.create({
    contractId: intranetContract.id,
    fromFeeGroupId: intranetContract.feeGroupId,
    toFeeGroupId: feeGroupId,
    executedDate: moment().format('YYYY-MM-DD HH:mm:ss'),
    previsionDate: moment().format('YYYY-MM-DD HH:mm:ss'),
    done: true,
  });
  await intranetContract.update({ feeGroupId: feeGroupId });
  // check discounts
  await updateAllFromClient(intranetContract.clientId);
  await sync(intranetContract.id);
};
