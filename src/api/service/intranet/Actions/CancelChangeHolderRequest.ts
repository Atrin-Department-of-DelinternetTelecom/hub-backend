import { Aire } from '@lib/sdk';
import { AnyModel } from '@models';
import { CELL_PROVIDER_CODE } from '@api/constants/contracts';
import assert from 'assert';
import { provider } from '../Contract/helpers';

/**
 * Second step, search for documentation and if done consolide change
 */
export const handle = async (changeHolder: AnyModel) => {
  const cellProvider = await provider(changeHolder.contractId);

  if (cellProvider !== CELL_PROVIDER_CODE.AIRE) {
    return;
  }

  assert(changeHolder.provider_tracking_code, `Missing AIRE request code`);

  await Aire.cancelRequestLine({ codigo: changeHolder.provider_tracking_code });
};
