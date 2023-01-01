import { DATA_FIX_TYPE, SERVICE } from '@api/constants/contracts';
import { associateBy, pluck } from '@api/utils/collections';

import { CONTRACT } from '@api/constants/statuses';
import { GfContractDataFix } from '@api/models/intranet/intranet_gf_contract_data_fix';
import { GfSection } from '@api/models/intranet/intranet_gf_sections';
import { OperadorLandline } from '@api/models/intranet/intranet_operador_landline';
import { execute } from '../GfContractSectionStatusService';
import { intranet } from '@api/models';
import to from 'await-to-js';

const { GfContract } = intranet;

/**
 * Revision given aire contracts.
 */
export const handle = async (userId = 0) => {
  const contracts = await pendingContracts();
  const landlines = await getLandlines(pluck(contracts, 'dataFix.number'));
  const { id: sectionId } = await GfSection.findByCode(SERVICE.FIX);

  for (const { id, 'dataFix.number': number } of contracts) {
    const landline = landlines[number];
    // without operador landline
    if (landline === undefined) continue;
    // execute to update state
    const [error] = await to(execute(id, sectionId, userId));
    // something went wrong!
    if (error) {
      console.error(`[RevisionFixContracts][${number}]: ${error.message}`);
    }
  }
};

const pendingContracts = async () => {
  return GfContract.findAll({
    attributes: ['id'],
    where: { state: [CONTRACT.PENDING_CHANGE, CONTRACT.PENDING_SECTION_READY] },
    include: {
      model: GfContractDataFix,
      as: 'dataFix',
      attributes: ['number'],
      where: { type: DATA_FIX_TYPE.PARTICULAR },
    },
    raw: true,
  });
};

const getLandlines = async (numbers: string[]) => {
  return associateBy(
    await OperadorLandline.findAll({
      where: { number: numbers },
      attributes: ['number', 'id'],
    }),
    ({ number }) => String(number),
  );
};
