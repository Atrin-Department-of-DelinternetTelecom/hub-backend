import { blockContract, restoreContract } from '../RadiusService';

import { CONTRACT } from '@api/constants/statuses';
import { RadiusDifference } from '@api/models/global/global_radius_difference';
import { handle as RefreshRadiusLookup } from './RefreshRadiusLookup';
import { intranet } from '@api/models';
import to from 'await-to-js';

const { GfContract, GfContractDataInternet } = intranet;

/**
 * Sync radius state by contract state.
 */
export const handle = async (differences: number[] = []) => {
  const wheres: Record<string, any> = { has_valid_state: false };
  if (differences.length > 0) {
    wheres.id = differences;
  }
  const radiusDifferences = await RadiusDifference.findAll({
    where: wheres,
    attributes: ['is_active', 'gf_contract_id'],
    include: {
      model: GfContract,
      attributes: ['state'],
      include: [
        { model: GfContractDataInternet, as: 'dataInternet', attributes: [] },
      ],
      where: { state: [CONTRACT.ACTIVE, CONTRACT.BLOCKED] },
    },
  });

  for (const { GfContract, is_active, gf_contract_id } of radiusDifferences) {
    if (GfContract!.isActive() && !is_active) {
      console.log(await to(restoreContract(gf_contract_id)));
    } else if (GfContract!.isBlocked() && is_active) {
      console.log(await to(blockContract(gf_contract_id)));
    }
  }
  // update old differences
  if (radiusDifferences.length > 0) {
    await RefreshRadiusLookup(
      radiusDifferences.map(({ username }) => username),
    );
  }
};
