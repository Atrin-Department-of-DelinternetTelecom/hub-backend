import { AnyModel, intranet } from '@api/models';
import { associateBy, pluck } from '@api/utils/collections';

import { BONUS } from '@api/constants/statuses';
import { GfBonus } from '@api/models/intranet/intranet_gf_bonus';
import { GfBonusContractXref } from '@api/models/intranet/intranet_gf_bonus_contract_xref';
import { GfBonusHistory } from '@api/models/intranet/intranet_gf_bonus_history';
import { LemonLine } from '@api/models/intranet/intranet_lemon_line';
import { Op } from 'sequelize';
import moment from 'moment';

const { GfContract, transaction } = intranet;

const getContractsMap = async (contractIds: number[]) => {
  return associateBy(
    await GfContract.findAll({ where: { id: contractIds } }),
    ({ id }) => id,
  );
};

/**
 * Sync the intranet contracts bonuses for the given AIRE contracts.
 */
export const handle = async (lines: LemonLine[]) => {
  const contracts = await getContractsMap(pluck(lines, 'gf_contract_id'));

  for (const line of lines) {
    // contract not found
    if (!line.gf_contract_id || !contracts[line.gf_contract_id]) {
      continue;
    }
    // sync bonuses
    await syncBonuses(
      contracts[line.gf_contract_id],
      pluck(line.bonuses(), 'packageId'),
    );
  }
};

const syncBonuses = async (contract: AnyModel, providerCodes: string[]) => {
  // update bonuses
  await attachBonuses(contract, providerCodes);
  // remove invalid bonuses
  await detachBonuses(contract, providerCodes);
};

const attachBonuses = async (contract: AnyModel, providerCodes: string[]) => {
  const bonusIds = await getBonusIds(providerCodes);

  await Promise.all(bonusIds.map((bonoId) => attachBonus(contract.id, bonoId)));
};

const attachBonus = async (contractId: number, bonoId: number) => {
  return transaction(async () => {
    const initDate = moment().toISOString();
    const [{ id: xrefId }] = await GfBonusContractXref.findOrCreate({
      where: { bonoId, contractId },
      defaults: { state: BONUS.DONE, bonoId, contractId },
    });
    // save bonus assignment history
    const [_, created] = await GfBonusHistory.findOrCreate({
      where: { xrefId },
      defaults: { xrefId, bonoId, contractId, initDate },
    });
    // Update the initDate if the record already existed
    if (!created) {
      await GfBonusHistory.update({ initDate }, { where: { xrefId } });
    }
  });
};

const detachBonuses = async (contract: AnyModel, except: string[]) => {
  const shouldDetached = pluck(
    await GfBonusContractXref.findAll({
      where: { contractId: contract.id },
      include: {
        model: GfBonus,
        as: 'bonus',
        where: { providerCode: { [Op.not]: except } },
      },
      attributes: ['id'],
      raw: true,
    }),
    'id',
  );

  transaction(async () => {
    await GfBonusHistory.update(
      { status: 0 },
      { where: { xrefId: shouldDetached } },
    );
    await GfBonusContractXref.update(
      { status: 0 },
      { where: { id: shouldDetached } },
    );
  });
};

const getBonusIds = async (providerCodes: string[]) => {
  return pluck(
    await GfBonus.findAll({
      where: { providerCode: providerCodes },
      attributes: ['id'],
      raw: true,
    }),
    'id',
  );
};
