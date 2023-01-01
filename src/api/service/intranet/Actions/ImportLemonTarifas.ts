import { GfCellProviderFee } from '@api/models/intranet/intranet_gf_cell_providers_fees';
import { GfFee } from '@api/models/intranet/intranet_gf_fees';
import { GfFeeGroup } from '@api/models/intranet/intranet_gf_fee_groups';
import { Op } from 'sequelize';
import { ProductData } from '@del-internet/lemon';
import assert from 'assert';
import { lemon } from '@lib/lemon';
import { pluck } from '@api/utils/collections';

const PROVIDER_ID = 2;

/**
 * Import LEMON tarifa data.
 * Following code sync the LEMON service taifa (FEE) by the local fees.
 */
export const handle = async (init = false): Promise<void> => {
  assert(lemon, 'lemon config not valid');
  const tarifas = await getLemonRates(init);
  // Remove old cell fees
  await removeOldCellFees(tarifas);
  const exists = await getExistingCellFees();
  const existsProviderFeeId = exists.map(({ providerFeeId }) => providerFeeId);
  // Insert new items
  await insertNewCellFees(tarifas, existsProviderFeeId);
  // Update existing items
  await updateExistingCellFees(tarifas, exists);
};

const getLemonRates = async (init = false) => {
  const activeRates = (await lemon.fee.getProducto('0')).data;

  if (init === false) {
    return activeRates.map((rate) => ({ ...rate, active: true }));
  }

  const activePackages = pluck(activeRates, 'packageId');
  const rates = (await lemon.fee.getProductoDisponable()).data;

  return rates.map((rate) => ({
    ...rate,
    active: activePackages.includes(rate.packageId),
  }));
};

const removeOldCellFees = async (tarifas: ProductData[]): Promise<void> => {
  const oldProviderFeeIds = tarifas.map(({ packageId }) => packageId);

  const toDisableOldProviderFeeIds = (
    await GfCellProviderFee.findAll({
      where: {
        providerId: PROVIDER_ID,
        providerFeeId: {
          [Op.notIn]: oldProviderFeeIds,
        },
      },
    })
  ).map((cellFee) => cellFee.providerFeeId);

  await GfCellProviderFee.update(
    { providerState: 0 },
    {
      where: {
        providerId: PROVIDER_ID,
        providerFeeId: {
          [Op.in]: toDisableOldProviderFeeIds,
        },
      },
    },
  );

  const deactiveFeeGroups = (
    await GfFee.findAll({
      where: { tpvCode: { [Op.in]: toDisableOldProviderFeeIds } },
    })
  ).map((gfFee) => gfFee.feeGroupId);

  await GfFeeGroup.update(
    { active: 0 },
    {
      where: {
        id: {
          [Op.in]: deactiveFeeGroups,
        },
      },
    },
  );

  //todoALILEMON: fix log
  console.log(`[${new Date()}] following lemon tarifas removed:`);
  console.log(JSON.stringify(oldProviderFeeIds));
};

const getExistingCellFees = async () => {
  return GfCellProviderFee.findAll({
    where: { providerId: PROVIDER_ID },
  });
};

const insertNewCellFees = async (
  tarifas: ProductData[],
  existsProviderFeeId: string[],
): Promise<void> => {
  const newCellFees = tarifas
    .filter(({ packageId }) => !existsProviderFeeId.includes(packageId))
    .map(({ packageId, nombre, precio }: ProductData) => {
      return {
        providerState: 1,
        providerId: PROVIDER_ID,
        tpvCode: packageId,
        providerFeeId: packageId,
        providerName: nombre,
        providerBaseQuote: Number(precio ?? '0'),
      };
    });
  await GfCellProviderFee.bulkCreate(newCellFees);

  console.log(`[${new Date()}] following lemon tarifas inserted:`);
  console.log(JSON.stringify(newCellFees));
};

const updateExistingCellFees = async (
  tarifas: (ProductData & { active: boolean })[],
  exists: GfCellProviderFee[],
): Promise<void> => {
  await Promise.all(
    exists.map((cellFee) => {
      const tarifa = tarifas.find(
        ({ packageId }) => cellFee.providerFeeId === packageId,
      );
      assert(
        tarifa,
        `[ImportLemonTarifas] Lemon rate "${cellFee.providerFeeId}" not found`,
      );

      const newPrice = Number(tarifa?.precio ?? 0);
      const priceToUse = newPrice !== 0 ? newPrice : cellFee.providerBaseQuote;

      cellFee.fillFromTarifa(
        tarifa?.active,
        tarifa?.nombre ?? cellFee.providerName,
        Number(priceToUse),
      );

      return cellFee.save();
    }),
  );

  console.log(`[${new Date()}] following LEMON tarifas updated:`);
  console.log(JSON.stringify(tarifas.map(({ packageId }) => packageId)));
};
