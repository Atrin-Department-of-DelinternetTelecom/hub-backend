import { AnyModel, intranet } from '@api/models';
import { pluck, unique } from '@api/utils/collections';

import { AdditionalBono } from '@delinternet/sdk-aire';
import { AireAdditionalBono } from '../AireService';
import { GfCellProviderFee } from '@api/models/intranet/intranet_gf_cell_providers_fees';
import { Op } from 'sequelize';
import { groupBy } from 'lodash';
import to from 'await-to-js';

const { GfCellProviderFeeBonus, GfCellProviderFeeBonusXref } = intranet;

const PROVIDER_ID = 1;
type BonusXref = {
  id: string | number;
  autoRenewable: 0 | 1;
  basicFee: 0 | 1;
};

/**
 * Import AIRE tarifa data.
 */
export const handle = async (): Promise<void> => {
  const providerBonuses: AdditionalBono[] = [];
  const feeBonusXref: Record<string, BonusXref[]> = {};

  for (const providerFeeId of await getProviderFees()) {
    for (const bono of await getAireBonuses(providerFeeId)) {
      providerBonuses.push(bono);

      if (feeBonusXref[providerFeeId] === undefined) {
        feeBonusXref[providerFeeId] = [];
      }

      feeBonusXref[providerFeeId].push({
        id: bono.id,
        autoRenewable: bono.auto_renovable == 'S' ? 1 : 0,
        basicFee: bono.tarifa_basica == 'S' ? 1 : 0,
      });
    }
  }

  await updateBonusDatabaseFrom(unique(providerBonuses, 'id'));
  await updateFeeBonusXrefDatabaseFrom(feeBonusXref);
};

const getProviderFees = async () => {
  return Array.from(
    new Set(
      pluck(
        await GfCellProviderFee.findAll({
          attributes: ['providerFeeId'],
          raw: true,
        }),
        'providerFeeId',
      ),
    ),
  );
};

const getAireBonuses = async (providerFeeId: string) => {
  const [error, bonuses] = await to(
    AireAdditionalBono.findAllAndIgnoreIncompatibleError({
      tarifa: providerFeeId,
    }),
  );

  if (error) {
    console.error(
      `[ImportAireBonuses][getAireBonuses] missing aire bonus for providerFeeId:${providerFeeId}`,
      error,
    );
  }

  return bonuses ?? [];
};

const updateBonusDatabaseFrom = async function (
  providerBonuses: AdditionalBono[],
) {
  await GfCellProviderFeeBonus.destroy({
    where: { providerBonusId: pluck(providerBonuses, 'id') },
  });

  await insertProviderBonuses(providerBonuses);
};

const insertProviderBonuses = async (providerBonuses: AdditionalBono[]) => {
  await GfCellProviderFeeBonus.bulkCreate(
    providerBonuses.map((providerBonus) => {
      return {
        providerBonusId: providerBonus.id,
        tpvCode: providerBonus.id,
        providerState: providerBonus.estado == 'ON' ? 1 : 0,
        name: providerBonus.nombre,
        pvp: providerBonus.pvp,
        minutes: providerBonus.min,
        gb: providerBonus.gb,
        description: providerBonus.descripcion,
        bonusType: providerBonus.tipo_bono,
      };
    }),
  );

  console.log(`[${new Date()}] following bonus inserted:`);
  console.log(providerBonuses.map(({ id, nombre }) => `${id}:${nombre}`));
};

const updateFeeBonusXrefDatabaseFrom = async (
  feeBonusXrefs: Record<string, BonusXref[]>,
) => {
  const exists: number[][] = [];
  for (const providerFeeId in feeBonusXrefs) {
    exists.push(
      await syncBonusXrefs(feeBonusXrefs[providerFeeId], providerFeeId),
    );
  }

  console.log(`[${new Date()}] following attaches updated:`);
  console.log(JSON.stringify(feeBonusXrefs));

  await GfCellProviderFeeBonusXref.update(
    { status: 0 },
    { where: { id: { [Op.notIn]: exists.flat() } } },
  );
};

const syncBonusXrefs = async (
  feeBonusXrefs: BonusXref[],
  providerFeeId: string,
) => {
  return Promise.all(
    feeBonusXrefs.map(async ({ id, autoRenewable, basicFee }) => {
      const [xref] = await GfCellProviderFeeBonusXref.findOrCreate({
        where: {
          providerFeeId,
          providerBonusId: id,
          providerId: PROVIDER_ID,
        },
      });

      await xref.update({ autoRenewable, basicFee });

      return xref.id;
    }),
  );
};
