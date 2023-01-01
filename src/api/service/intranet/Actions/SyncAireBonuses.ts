import { AnyModel, intranet } from '@api/models';
import { associateBy, pluck } from '@api/utils/collections';

import { BONUS } from '@api/constants/statuses';
import { Bono } from '@delinternet/sdk-aire';
import { GfAireContract } from '@api/models/intranet/intranet_gf_aire_contracts';
import { GfBonus } from '@api/models/intranet/intranet_gf_bonus';
import { GfBonusContractXref } from '@api/models/intranet/intranet_gf_bonus_contract_xref';
import { GfBonusHistory } from '@api/models/intranet/intranet_gf_bonus_history';
import { Op } from 'sequelize';

const { GfContract, transaction } = intranet;

/**
 * Sync the intranet contracts bonuses for the given AIRE contracts.
 */
export const handle = async (aireContracts: GfAireContract[]) => {
  const bonusIdByProviderCode = pluck(
    await GfBonus.findAll({
      attributes: ['id', 'providerCode'],
      raw: true,
    }),
    'id',
    'providerCode',
  );
  const contracts = associateBy(
    await GfContract.findAll({
      where: {
        id: aireContracts.map(({ linkedContractId }) => linkedContractId),
      },
    }),
    ({ id }) => id,
  );

  for (const aireContract of aireContracts) {
    // contract not found
    if (
      !aireContract.linkedContractId ||
      !contracts[aireContract.linkedContractId]
    ) {
      continue;
    }
    const aireLine = aireContract.getAireData();
    // without any bonuses
    if (!Array.isArray(aireLine?.bonos) || !aireLine?.bonos.length) {
      continue;
    }
    // sync bonuses
    await syncBonuses(
      contracts[aireContract.linkedContractId],
      aireLine.bonos.filter(
        ({ id, fecha_baja }) => !fecha_baja && bonusIdByProviderCode[id],
      ),
      bonusIdByProviderCode,
    );
  }
};

const syncBonuses = async (
  contract: AnyModel,
  aireBonuses: Bono[],
  bonusIdByProviderCode: Record<string, number>,
) => {
  // update bonuses
  await attachBonuses(contract, aireBonuses, bonusIdByProviderCode);

  // remove invalid bonuses
  await detachBonsuses(
    contract,
    aireBonuses.map(({ id }) => id),
  );
};

const attachBonuses = async (
  contract: AnyModel,
  aireBonuses: Bono[],
  bonusIdByProviderCode: Record<string, number>,
) => {
  await Promise.all(
    aireBonuses.map(async (aireBonus) => {
      return transaction(async () => {
        const [xref] = await GfBonusContractXref.findOrCreate({
          where: {
            bonoId: bonusIdByProviderCode[aireBonus.id],
            contractId: contract.id,
          },
          defaults: {
            state: BONUS.DONE,
            bonoId: bonusIdByProviderCode[aireBonus.id],
            contractId: contract.id,
          },
        });

        const [bonusHistory, created] = await GfBonusHistory.findOrCreate({
          where: { xrefId: xref.id },
          defaults: {
            xrefId: xref.id,
            bonoId: bonusIdByProviderCode[aireBonus.id],
            contractId: contract.id,
            initDate: aireBonus.fecha_alta,
          },
        });

        if (!created) {
          // Update the initDate if the record already existed
          await GfBonusHistory.update(
            { initDate: aireBonus.fecha_alta },
            { where: { xrefId: xref.id } },
          );
        }
      });
    }),
  );
};

const detachBonsuses = async (contract: AnyModel, except: string[]) => {
  const shouldDetached = pluck(
    await GfBonusContractXref.findAll({
      where: { contractId: contract.id },
      include: {
        model: GfBonus,
        as: 'bonus',
        where: { providerCode: { [Op.not]: except } },
      },
    }),
    'id',
  );

  transaction(async () => {
    await GfBonusHistory.update(
      { status: 0 },
      {
        where: { xrefId: shouldDetached },
      },
    );
    await GfBonusContractXref.update(
      { status: 0 },
      {
        where: { id: shouldDetached },
      },
    );
  });
};
